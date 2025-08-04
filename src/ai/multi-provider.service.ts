import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import Anthropic from '@anthropic-ai/sdk';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseMessage } from '@langchain/core/messages';
import { ChatMessage, GenerationParams } from './ai.service';

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  MISTRAL = 'mistral',
  COHERE = 'cohere',
}

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface MultiProviderParams extends GenerationParams {
  provider?: AIProvider;
  fallbackProviders?: AIProvider[];
  useSmartRouting?: boolean;
}

@Injectable()
export class MultiProviderAIService {
  private readonly logger = new Logger(MultiProviderAIService.name);
  private readonly outputParser: StringOutputParser;
  private readonly providerConfigs: Map<AIProvider, ProviderConfig>;
  private readonly langchainModels: Map<AIProvider, ChatOpenAI>;
  private anthropicClient: Anthropic;

  constructor(private configService: ConfigService) {
    this.outputParser = new StringOutputParser();
    this.providerConfigs = new Map();
    this.langchainModels = new Map();

    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI / OpenRouter configuration
    const openaiConfig: ProviderConfig = {
      apiKey: this.configService.get<string>('OPENAI_KEY'),
      baseURL: this.configService.get<string>('OPENAI_URL'),
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
      maxTokens: 2000,
      temperature: 0.7,
    };

    if (openaiConfig.apiKey) {
      this.providerConfigs.set(AIProvider.OPENAI, openaiConfig);
      this.langchainModels.set(AIProvider.OPENAI, new ChatOpenAI({
        apiKey: openaiConfig.apiKey,
        model: openaiConfig.model,
        temperature: openaiConfig.temperature,
        maxTokens: openaiConfig.maxTokens,
        configuration: openaiConfig.baseURL ? { baseURL: openaiConfig.baseURL } : undefined,
      }));
    }

    // Anthropic configuration
    const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicApiKey) {
      const anthropicConfig: ProviderConfig = {
        apiKey: anthropicApiKey,
        model: this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022',
        maxTokens: 2000,
        temperature: 0.7,
      };

      this.providerConfigs.set(AIProvider.ANTHROPIC, anthropicConfig);
      this.anthropicClient = new Anthropic({
        apiKey: anthropicApiKey,
      });
    }

    // Gemini configuration (through OpenAI-compatible API)
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiApiKey) {
      const geminiConfig: ProviderConfig = {
        apiKey: geminiApiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-pro',
        maxTokens: 2000,
        temperature: 0.7,
      };

      this.providerConfigs.set(AIProvider.GEMINI, geminiConfig);
      this.langchainModels.set(AIProvider.GEMINI, new ChatOpenAI({
        apiKey: geminiConfig.apiKey,
        model: geminiConfig.model,
        temperature: geminiConfig.temperature,
        maxTokens: geminiConfig.maxTokens,
        configuration: { baseURL: geminiConfig.baseURL },
      }));
    }

    // Mistral configuration
    const mistralApiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (mistralApiKey) {
      const mistralConfig: ProviderConfig = {
        apiKey: mistralApiKey,
        baseURL: 'https://api.mistral.ai/v1',
        model: this.configService.get<string>('MISTRAL_MODEL') || 'mistral-large-latest',
        maxTokens: 2000,
        temperature: 0.7,
      };

      this.providerConfigs.set(AIProvider.MISTRAL, mistralConfig);
      this.langchainModels.set(AIProvider.MISTRAL, new ChatOpenAI({
        apiKey: mistralConfig.apiKey,
        model: mistralConfig.model,
        temperature: mistralConfig.temperature,
        maxTokens: mistralConfig.maxTokens,
        configuration: { baseURL: mistralConfig.baseURL },
      }));
    }

    // Cohere configuration (through OpenAI-compatible API)
    const cohereApiKey = this.configService.get<string>('COHERE_API_KEY');
    if (cohereApiKey) {
      const cohereConfig: ProviderConfig = {
        apiKey: cohereApiKey,
        baseURL: 'https://api.cohere.ai/v1',
        model: this.configService.get<string>('COHERE_MODEL') || 'command-r-plus',
        maxTokens: 2000,
        temperature: 0.7,
      };

      this.providerConfigs.set(AIProvider.COHERE, cohereConfig);
      this.langchainModels.set(AIProvider.COHERE, new ChatOpenAI({
        apiKey: cohereApiKey,
        model: cohereConfig.model,
        temperature: cohereConfig.temperature,
        maxTokens: cohereConfig.maxTokens,
        configuration: { baseURL: cohereConfig.baseURL },
      }));
    }

    this.logger.log(`Initialized ${this.providerConfigs.size} AI providers: ${Array.from(this.providerConfigs.keys()).join(', ')}`);
  }

  async chatCompletion(messages: ChatMessage[], params?: MultiProviderParams): Promise<string> {
    const provider = await this.selectOptimalProvider(messages, params);
    const fallbackProviders = params?.fallbackProviders || [];

    try {
      return await this.executeWithProvider(provider, messages, params);
    } catch (error) {
      this.logger.warn(`Provider ${provider} failed: ${error.message}`);
      
      // Try fallback providers
      for (const fallbackProvider of fallbackProviders) {
        if (fallbackProvider !== provider && this.providerConfigs.has(fallbackProvider)) {
          try {
            this.logger.log(`Trying fallback provider: ${fallbackProvider}`);
            return await this.executeWithProvider(fallbackProvider, messages, params);
          } catch (fallbackError) {
            this.logger.warn(`Fallback provider ${fallbackProvider} failed: ${fallbackError.message}`);
          }
        }
      }

      // If all providers fail, use the original AI service as final fallback
      throw error;
    }
  }

  async *streamChatCompletion(messages: ChatMessage[], params?: MultiProviderParams): AsyncGenerator<string, void, unknown> {
    const provider = await this.selectOptimalProvider(messages, params);

    try {
      if (provider === AIProvider.ANTHROPIC) {
        yield* this.streamWithAnthropic(messages, params);
      } else {
        yield* this.streamWithLangchain(provider, messages, params);
      }
    } catch (error) {
      this.logger.error(`Streaming failed for provider ${provider}: ${error.message}`);
      
      // Fallback to non-streaming response
      try {
        const response = await this.chatCompletion(messages, params);
        const words = response.split(' ');
        for (const word of words) {
          yield word + ' ';
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (fallbackError) {
        this.logger.error(`Fallback streaming failed: ${fallbackError.message}`);
        yield 'Error: Unable to generate response';
      }
    }
  }

  async generateText(prompt: string, params?: MultiProviderParams): Promise<string> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chatCompletion(messages, params);
  }

  async getAvailableProviders(): Promise<{ provider: AIProvider; model: string; status: 'available' | 'error' }[]> {
    const providers = [];
    
    for (const [provider, config] of this.providerConfigs.entries()) {
      try {
        // Test each provider with a simple request
        await this.testProvider(provider);
        providers.push({
          provider,
          model: config.model,
          status: 'available' as const,
        });
      } catch (error) {
        providers.push({
          provider,
          model: config.model,
          status: 'error' as const,
        });
      }
    }

    return providers;
  }

  async getProviderCapabilities(provider: AIProvider): Promise<{
    supportedFeatures: string[];
    maxTokens: number;
    supportsStreaming: boolean;
    supportsTools: boolean;
    costPer1kTokens?: number;
  }> {
    const config = this.providerConfigs.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const capabilities = {
      supportedFeatures: ['text_generation', 'conversation'],
      maxTokens: config.maxTokens || 2000,
      supportsStreaming: true,
      supportsTools: false,
      costPer1kTokens: undefined,
    };

    switch (provider) {
      case AIProvider.OPENAI:
        capabilities.supportedFeatures.push('function_calling', 'json_mode', 'vision');
        capabilities.supportsTools = true;
        capabilities.costPer1kTokens = 0.002;
        break;
      case AIProvider.ANTHROPIC:
        capabilities.supportedFeatures.push('function_calling', 'vision', 'large_context');
        capabilities.supportsTools = true;
        capabilities.maxTokens = 8000;
        capabilities.costPer1kTokens = 0.003;
        break;
      case AIProvider.GEMINI:
        capabilities.supportedFeatures.push('function_calling', 'vision', 'large_context');
        capabilities.supportsTools = true;
        capabilities.maxTokens = 1000000;
        capabilities.costPer1kTokens = 0.001;
        break;
      case AIProvider.MISTRAL:
        capabilities.supportedFeatures.push('function_calling');
        capabilities.supportsTools = true;
        capabilities.costPer1kTokens = 0.002;
        break;
      case AIProvider.COHERE:
        capabilities.supportedFeatures.push('semantic_search', 'classification');
        capabilities.costPer1kTokens = 0.0015;
        break;
    }

    return capabilities;
  }

  private async selectOptimalProvider(messages: ChatMessage[], params?: MultiProviderParams): Promise<AIProvider> {
    // If provider is explicitly specified, use it
    if (params?.provider && this.providerConfigs.has(params.provider)) {
      return params.provider;
    }

    // Smart routing based on message content and requirements
    if (params?.useSmartRouting) {
      return this.smartRouting(messages, params);
    }

    // Default to first available provider
    const availableProviders = Array.from(this.providerConfigs.keys());
    return availableProviders[0] || AIProvider.OPENAI;
  }

  private async smartRouting(messages: ChatMessage[], params?: MultiProviderParams): Promise<AIProvider> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const messageLength = lastMessage.length;
    const hasCodeRequest = /code|program|script|function|class|algorithm/i.test(lastMessage);
    const hasCreativeRequest = /story|creative|poem|imagine|art/i.test(lastMessage);
    const hasAnalysisRequest = /analyze|compare|explain|reasoning|logic/i.test(lastMessage);
    const hasLongContext = messageLength > 10000 || messages.length > 20;

    // Route based on content type and requirements
    if (hasLongContext && this.providerConfigs.has(AIProvider.GEMINI)) {
      return AIProvider.GEMINI; // Best for long context
    }

    if (hasCreativeRequest && this.providerConfigs.has(AIProvider.ANTHROPIC)) {
      return AIProvider.ANTHROPIC; // Excellent for creative tasks
    }

    if (hasCodeRequest && this.providerConfigs.has(AIProvider.OPENAI)) {
      return AIProvider.OPENAI; // Strong coding capabilities
    }

    if (hasAnalysisRequest && this.providerConfigs.has(AIProvider.ANTHROPIC)) {
      return AIProvider.ANTHROPIC; // Great reasoning abilities
    }

    // Default fallback
    return Array.from(this.providerConfigs.keys())[0] || AIProvider.OPENAI;
  }

  private async executeWithProvider(provider: AIProvider, messages: ChatMessage[], params?: MultiProviderParams): Promise<string> {
    if (provider === AIProvider.ANTHROPIC) {
      return this.executeWithAnthropic(messages, params);
    } else {
      return this.executeWithLangchain(provider, messages, params);
    }
  }

  private async executeWithLangchain(provider: AIProvider, messages: ChatMessage[], params?: MultiProviderParams): Promise<string> {
    const model = this.langchainModels.get(provider);
    if (!model) {
      throw new Error(`Provider ${provider} not configured for LangChain`);
    }

    const langchainMessages = this.convertToLangChainMessages(messages);
    const chain = model.pipe(this.outputParser);
    
    return await chain.invoke(langchainMessages);
  }

  private async executeWithAnthropic(messages: ChatMessage[], params?: MultiProviderParams): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not configured');
    }

    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    const systemMessage = messages.find(msg => msg.role === 'system')?.content;

    const response = await this.anthropicClient.messages.create({
      model: this.providerConfigs.get(AIProvider.ANTHROPIC)?.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params?.maxTokens || 2000,
      temperature: params?.temperature || 0.7,
      system: systemMessage,
      messages: anthropicMessages as any,
    });

    return response.content.map(block => block.type === 'text' ? block.text : '').join('');
  }

  private async *streamWithLangchain(provider: AIProvider, messages: ChatMessage[], params?: MultiProviderParams): AsyncGenerator<string, void, unknown> {
    const model = this.langchainModels.get(provider);
    if (!model) {
      throw new Error(`Provider ${provider} not configured for streaming`);
    }

    const streamingModel = new ChatOpenAI({
      ...model,
      streaming: true,
    });

    const langchainMessages = this.convertToLangChainMessages(messages);
    const stream = await streamingModel.stream(langchainMessages);

    for await (const chunk of stream) {
      if (chunk.content) {
        const content = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
        yield content;
      }
    }
  }

  private async *streamWithAnthropic(messages: ChatMessage[], params?: MultiProviderParams): AsyncGenerator<string, void, unknown> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not configured');
    }

    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    const systemMessage = messages.find(msg => msg.role === 'system')?.content;

    const stream = await this.anthropicClient.messages.create({
      model: this.providerConfigs.get(AIProvider.ANTHROPIC)?.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params?.maxTokens || 2000,
      temperature: params?.temperature || 0.7,
      system: systemMessage,
      messages: anthropicMessages as any,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  private async testProvider(provider: AIProvider): Promise<void> {
    const testMessage: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    
    try {
      await this.executeWithProvider(provider, testMessage, { maxTokens: 10 });
    } catch (error) {
      throw new Error(`Provider ${provider} test failed: ${error.message}`);
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

  async getProviderStats(): Promise<{
    totalProviders: number;
    activeProviders: number;
    providerHealth: Record<AIProvider, boolean>;
    recommendedProvider: AIProvider;
  }> {
    const totalProviders = this.providerConfigs.size;
    const providerHealth: Record<AIProvider, boolean> = {} as any;
    let activeProviders = 0;

    for (const provider of this.providerConfigs.keys()) {
      try {
        await this.testProvider(provider);
        providerHealth[provider] = true;
        activeProviders++;
      } catch {
        providerHealth[provider] = false;
      }
    }

    // Recommend best available provider
    const recommendedProvider = this.getRecommendedProvider(providerHealth);

    return {
      totalProviders,
      activeProviders,
      providerHealth,
      recommendedProvider,
    };
  }

  private getRecommendedProvider(health: Record<AIProvider, boolean>): AIProvider {
    const priorityOrder = [
      AIProvider.ANTHROPIC,
      AIProvider.OPENAI,
      AIProvider.GEMINI,
      AIProvider.MISTRAL,
      AIProvider.COHERE,
    ];

    for (const provider of priorityOrder) {
      if (health[provider] && this.providerConfigs.has(provider)) {
        return provider;
      }
    }

    return Array.from(this.providerConfigs.keys())[0] || AIProvider.OPENAI;
  }
}