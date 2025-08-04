import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import {
	HumanMessage,
	SystemMessage,
	AIMessage,
} from '@langchain/core/messages';
import { DynamicTool } from '@langchain/community/tools/dynamic';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import {
	ChatPromptTemplate,
	MessagesPlaceholder,
} from '@langchain/core/prompts';
import {
	createLangChainTools,
	getToolsByCategory,
	ToolCategory,
} from '@/common/config/tools.config';

@Injectable()
export class LangChainService {
	private llm: ChatOpenAI;

	constructor() {
		this.llm = new ChatOpenAI({
			modelName: 'gpt-3.5-turbo',
			temperature: 0.7,
			maxTokens: 2000,
			openAIApiKey: process.env.OPENAI_API_KEY,
		});
	}

	async processChat(context: any) {
		try {
			const {
				agentName,
				systemPrompt,
				availableTools,
				userMessage,
				conversationHistory,
				userId,
			} = context;

			// Create tools for agent
			const tools = this.createToolsForAgent(availableTools);

			// Create prompt template
			const prompt = ChatPromptTemplate.fromMessages([
				['system', systemPrompt],
				new MessagesPlaceholder('chat_history'),
				['human', '{input}'],
				new MessagesPlaceholder('agent_scratchpad'),
			]);

			// Create agent
			const agent = await createOpenAIFunctionsAgent({
				llm: this.llm,
				tools,
				prompt,
			});

			// Create agent executor
			const agentExecutor = new AgentExecutor({
				agent,
				tools,
				verbose: true,
				maxIterations: 3,
			});

			// Prepare chat history
			const chatHistory = this.formatChatHistory(conversationHistory);

			// Execute agent
			const result = await agentExecutor.invoke({
				input: userMessage,
				chat_history: chatHistory,
			});

			return {
				message: result.output,
				toolsUsed: this.extractToolsUsed(result),
				agentName,
				userId,
			};
		} catch (error) {
			console.error('Error in LangChain processing:', error);
			throw new Error(`LangChain processing failed: ${error.message}`);
		}
	}

	private createToolsForAgent(toolNames: string[]): DynamicTool[] {
		const tools: DynamicTool[] = [];

		for (const toolName of toolNames) {
			// Get tools from different categories
			const allCategoryTools = [
				...getToolsByCategory(ToolCategory.ARTISTIC_INSPIRATION),
				...getToolsByCategory(ToolCategory.CAREER_PLANNING),
				...getToolsByCategory(ToolCategory.CUSTOMER_SERVICE),
				...getToolsByCategory(ToolCategory.EMAIL_MANAGEMENT),
				...getToolsByCategory(ToolCategory.LEARNING_PLATFORM),
				...getToolsByCategory(ToolCategory.STRESS_MANAGEMENT),
				...getToolsByCategory(ToolCategory.RECOMMENDATION),
				...getToolsByCategory(ToolCategory.VIDEO_EDITING),
				...getToolsByCategory(ToolCategory.GENERAL),
			];

			const toolConfig = allCategoryTools.find(
				(tool) => tool.name === toolName
			);
			if (toolConfig) {
				const langChainTool = new DynamicTool({
					name: toolConfig.name,
					description: toolConfig.description,
					func: async (input: string) => {
						try {
							const params = JSON.parse(input);
							return await toolConfig.handler(params);
						} catch (error) {
							return `Error executing tool: ${error.message}`;
						}
					},
				});
				tools.push(langChainTool);
			}
		}

		return tools;
	}

	private formatChatHistory(conversationHistory: any[]): any[] {
		if (!conversationHistory || conversationHistory.length === 0) {
			return [];
		}

		return conversationHistory.map((message) => {
			if (message.role === 'user') {
				return new HumanMessage(message.content);
			} else if (message.role === 'assistant') {
				return new AIMessage(message.content);
			} else {
				return new SystemMessage(message.content);
			}
		});
	}

	private extractToolsUsed(result: any): string[] {
		// Extract tools used from the agent execution result
		// This is a simplified implementation
		const toolsUsed: string[] = [];

		if (result.intermediateSteps) {
			for (const step of result.intermediateSteps) {
				if (step.action && step.action.tool) {
					toolsUsed.push(step.action.tool);
				}
			}
		}

		return toolsUsed;
	}

	// Specialized methods for different types of AI tasks

	async generateText(prompt: string, options?: any) {
		try {
			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Text generation failed: ${error.message}`);
		}
	}

	async translateText(
		text: string,
		targetLanguage: string,
		sourceLanguage?: string
	) {
		try {
			const prompt = sourceLanguage
				? `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${text}"`
				: `Translate the following text to ${targetLanguage}: "${text}"`;

			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Translation failed: ${error.message}`);
		}
	}

	async summarizeText(text: string, maxLength?: number) {
		try {
			const prompt = maxLength
				? `Summarize the following text in no more than ${maxLength} words: "${text}"`
				: `Summarize the following text: "${text}"`;

			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Summarization failed: ${error.message}`);
		}
	}

	async analyzeText(text: string, analysisType: string) {
		try {
			const prompt = `Perform ${analysisType} analysis on the following text: "${text}"`;
			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Text analysis failed: ${error.message}`);
		}
	}

	async generateCode(description: string, language: string) {
		try {
			const prompt = `Generate ${language} code for the following requirement: "${description}". Please provide clean, well-commented code.`;
			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Code generation failed: ${error.message}`);
		}
	}

	async explainCode(code: string, language?: string) {
		try {
			const prompt = language
				? `Explain the following ${language} code: \n\`\`\`${language}\n${code}\n\`\`\``
				: `Explain the following code: \n\`\`\`\n${code}\n\`\`\``;

			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Code explanation failed: ${error.message}`);
		}
	}

	async createPrompt(task: string, context?: string) {
		try {
			const prompt = context
				? `Create an effective AI prompt for the following task: "${task}". Context: "${context}"`
				: `Create an effective AI prompt for the following task: "${task}"`;

			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Prompt creation failed: ${error.message}`);
		}
	}

	// Conversation management methods

	async continueConversation(
		conversationHistory: any[],
		newMessage: string,
		systemPrompt?: string
	) {
		try {
			const messages = [];

			if (systemPrompt) {
				messages.push(new SystemMessage(systemPrompt));
			}

			// Add conversation history
			messages.push(...this.formatChatHistory(conversationHistory));

			// Add new message
			messages.push(new HumanMessage(newMessage));

			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Conversation continuation failed: ${error.message}`);
		}
	}

	async generateResponse(userInput: string, context?: any) {
		try {
			const systemPrompt =
				context?.systemPrompt || 'You are a helpful AI assistant.';
			const messages = [
				new SystemMessage(systemPrompt),
				new HumanMessage(userInput),
			];

			const result = await this.llm.invoke(messages);
			return {
				response: result.content,
				timestamp: new Date().toISOString(),
				model: 'gpt-3.5-turbo',
			};
		} catch (error) {
			throw new Error(`Response generation failed: ${error.message}`);
		}
	}

	// Utility methods

	async validateInput(input: string, validationType: string) {
		try {
			const prompt = `Validate the following input for ${validationType}: "${input}". Return "VALID" if valid, or explain what's wrong if invalid.`;
			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Input validation failed: ${error.message}`);
		}
	}

	async extractInformation(text: string, informationType: string) {
		try {
			const prompt = `Extract ${informationType} from the following text: "${text}"`;
			const messages = [new HumanMessage(prompt)];
			const result = await this.llm.invoke(messages);
			return result.content;
		} catch (error) {
			throw new Error(`Information extraction failed: ${error.message}`);
		}
	}
}
