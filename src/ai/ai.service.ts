import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { BaseMessage } from '@langchain/core/messages';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LangChainChatMessage extends BaseMessage {
  content: string;
}

export interface GenerationParams {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly chatModel: ChatOpenAI;
  private readonly streamingModel: ChatOpenAI;
  private readonly outputParser: StringOutputParser;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_KEY');
    const baseURL = this.configService.get<string>('OPENAI_URL');
    const defaultModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('OPENAI_KEY environment variable is required');
    }

    // Initialize ChatOpenAI for regular operations
    this.chatModel = new ChatOpenAI({
      apiKey,
      model: defaultModel,
      temperature: 0.7,
      maxTokens: 2000,
      configuration: baseURL ? { baseURL } : undefined,
    });

    // Initialize ChatOpenAI for streaming operations
    this.streamingModel = new ChatOpenAI({
      apiKey,
      model: defaultModel,
      temperature: 0.7,
      maxTokens: 2000,
      streaming: true,
      configuration: baseURL ? { baseURL } : undefined,
    });

    this.outputParser = new StringOutputParser();
  }

  async chatCompletion(messages: ChatMessage[], params?: GenerationParams): Promise<string> {
    try {
      const langchainMessages = this.convertToLangChainMessages(messages);
      
      // Create a model instance with custom parameters if provided
      const model = params ? new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: params.model || this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: params.temperature || 0.7,
        maxTokens: params.maxTokens || 2000,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      }) : this.chatModel;

      const chain = model.pipe(this.outputParser);
      const result = await chain.invoke(langchainMessages);
      
      return result;
    } catch (error) {
      this.logger.error(`AI Chat Completion failed: ${error.message}`, error.stack);
      
      // Fallback to a simple response if AI service fails
      return `I apologize, but I'm having trouble connecting to my AI service right now. Your message was: "${messages[messages.length - 1]?.content}". Please try again later.`;
    }
  }

  async generateText(prompt: string, params?: GenerationParams): Promise<string> {
    try {
      const model = params ? new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: params.model || this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: params.temperature || 0.7,
        maxTokens: params.maxTokens || 2000,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      }) : this.chatModel;

      const chain = model.pipe(this.outputParser);
      const result = await chain.invoke([new HumanMessage(prompt)]);
      
      return result;
    } catch (error) {
      this.logger.error(`Text generation failed: ${error.message}`, error.stack);
      return `Error generating text: ${error.message}`;
    }
  }

  async generateCode(prompt: string, language?: string, style?: string): Promise<string> {
    try {
      const systemPrompt = `You are a skilled programmer. Generate clean, well-documented ${language || 'JavaScript'} code. 
Follow ${style || 'modern'} coding standards and best practices. Include helpful comments.`;

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', '{input}'],
      ]);

      const chain = promptTemplate.pipe(this.chatModel).pipe(this.outputParser);
      const result = await chain.invoke({ 
        input: prompt,
        temperature: 0.3,
        maxTokens: 2000 
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Code generation failed: ${error.message}`, error.stack);
      return `Error generating code: ${error.message}`;
    }
  }

  async refactorCode(originalCode: string, instruction: string, language?: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert code refactoring assistant. Refactor the provided ${language || ''} code according to the given instructions. 
Maintain functionality while improving code quality, readability, and performance.`;

      const userPrompt = `Original code:
\`\`\`${language || ''}
${originalCode}
\`\`\`

Refactoring instruction: ${instruction}

Please provide the refactored code:`;

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);

      const model = new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 3000,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      });

      const chain = promptTemplate.pipe(model).pipe(this.outputParser);
      const result = await chain.invoke({});
      
      return result;
    } catch (error) {
      this.logger.error(`Code refactoring failed: ${error.message}`, error.stack);
      return `Error refactoring code: ${error.message}`;
    }
  }

  async formatCode(code: string, language?: string): Promise<string> {
    try {
      const systemPrompt = `You are a code formatting expert. Format the provided ${language || ''} code with proper indentation, spacing, and structure. 
Maintain all functionality while improving readability and following standard formatting conventions.`;

      const userPrompt = `Please format this code properly:
\`\`\`${language || ''}
${code}
\`\`\``;

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);

      const model = new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 2000,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      });

      const chain = promptTemplate.pipe(model).pipe(this.outputParser);
      const result = await chain.invoke({});
      
      return result;
    } catch (error) {
      this.logger.error(`Code formatting failed: ${error.message}`, error.stack);
      return `Error formatting code: ${error.message}`;
    }
  }

  async editFile(originalContent: string, instruction: string, filePath?: string): Promise<string> {
    try {
      const fileType = filePath ? this.getFileType(filePath) : 'text';
      
      const systemPrompt = `You are a file editing assistant. Edit the provided ${fileType} file content according to the given instructions. 
Maintain the file's structure and format while making the requested changes.`;

      const userPrompt = `File: ${filePath || 'untitled'}
Original content:
\`\`\`
${originalContent}
\`\`\`

Edit instruction: ${instruction}

Please provide the edited content:`;

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);

      const model = new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 3000,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      });

      const chain = promptTemplate.pipe(model).pipe(this.outputParser);
      const result = await chain.invoke({});
      
      return result;
    } catch (error) {
      this.logger.error(`File editing failed: ${error.message}`, error.stack);
      return `Error editing file: ${error.message}`;
    }
  }

  async createFile(instruction: string, filePath?: string): Promise<string> {
    try {
      const fileType = filePath ? this.getFileType(filePath) : 'text';
      
      const systemPrompt = `You are a file creation assistant. Create ${fileType} file content based on the given instructions. 
Follow best practices and conventions for ${fileType} files.`;

      const userPrompt = `Create a ${fileType} file with the following requirements:
${instruction}

${filePath ? `File path: ${filePath}` : ''}

Please provide the complete file content:`;

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);

      const model = new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.4,
        maxTokens: 3000,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      });

      const chain = promptTemplate.pipe(model).pipe(this.outputParser);
      const result = await chain.invoke({});
      
      return result;
    } catch (error) {
      this.logger.error(`File creation failed: ${error.message}`, error.stack);
      return `Error creating file: ${error.message}`;
    }
  }

  async *streamChatCompletion(messages: ChatMessage[], params?: GenerationParams): AsyncGenerator<string, void, unknown> {
    try {
      const langchainMessages = this.convertToLangChainMessages(messages);
      
      // Create streaming model with custom parameters if provided
      const model = new ChatOpenAI({
        apiKey: this.configService.get<string>('OPENAI_KEY'),
        model: params?.model || this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: params?.temperature || 0.7,
        maxTokens: params?.maxTokens || 2000,
        streaming: true,
        configuration: this.configService.get<string>('OPENAI_URL') ? 
          { baseURL: this.configService.get<string>('OPENAI_URL') } : undefined,
      });

      const stream = await model.stream(langchainMessages);
      
      for await (const chunk of stream) {
        if (chunk.content) {
          // Ensure content is a string
          const content = typeof chunk.content === 'string' 
            ? chunk.content 
            : String(chunk.content);
          yield content;
        }
      }
    } catch (error) {
      this.logger.error(`AI Stream failed: ${error.message}`, error.stack);
      
      // Fallback to non-streaming response
      try {
        const fallbackResponse = await this.chatCompletion(messages, params);
        const words = fallbackResponse.split(' ');
        
        for (const word of words) {
          yield word + ' ';
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (fallbackError) {
        this.logger.error(`Fallback streaming failed: ${fallbackError.message}`, fallbackError.stack);
        yield 'Error: Unable to generate response';
      }
    }
  }

  private convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'user':
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  private getFileType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      txt: 'text',
    };

    return typeMap[extension || ''] || 'text';
  }
}