import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { LangChainService } from './langchain.service';
import { ToolsService } from './tools.service';
import { ChatRequestDto, AgentListDto } from './dto/agents.dto';
import {
	AgentConfig,
	agentConfigs,
	getAgentByName,
	ToolCategory,
} from '@/common/config/tools.config';

@Injectable()
export class AgentsService {
	constructor(
		private readonly langChainService: LangChainService,
		private readonly toolsService: ToolsService
	) {}

	async getAllAgents(): Promise<AgentListDto[]> {
		return agentConfigs.map((agent) => ({
			name: agent.name,
			description: agent.description,
			tools: agent.tools,
			category: this.getAgentCategory(agent.name),
		}));
	}

	async getAgentInfo(agentName: string): Promise<
		AgentConfig & {
			category: string;
			availableTools: {
				name: string;
				description: string;
				category: ToolCategory;
				schema: any;
				requiresAuth: boolean;
				permissions: string[];
			}[];
		}
	> {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		return {
			...agent,
			category: this.getAgentCategory(agentName),
			availableTools: agent.tools
				.map((toolName) => this.toolsService.getToolInfo(toolName))
				.filter((tool) => tool !== null),
		};
	}

	async chatWithAgent(agentName: string, chatRequest: ChatRequestDto) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		try {
			// Create context for agent
			const context = {
				agentName,
				systemPrompt: agent.systemPrompt,
				availableTools: agent.tools,
				userMessage: chatRequest.message,
				conversationHistory: chatRequest.conversationHistory || [],
				userId: chatRequest.userId,
			};

			// Use LangChain to process chat
			const response = await this.langChainService.processChat(context);

			return {
				agent: agentName,
				response: response.message,
				toolsUsed: response.toolsUsed || [],
				timestamp: new Date().toISOString(),
				conversationId:
					chatRequest.conversationId || this.generateConversationId(),
			};
		} catch (error) {
			throw new BadRequestException(
				`Error processing chat with agent ${agentName}: ${error.message}`
			);
		}
	}

	async executeAgentTool(agentName: string, toolName: string, parameters: any) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		if (!agent.tools.includes(toolName)) {
			throw new BadRequestException(
				`Tool ${toolName} is not available for agent ${agentName}`
			);
		}

		try {
			const result = await this.toolsService.executeTool({
				toolName,
				parameters,
				userId: parameters.userId,
			});

			return {
				agent: agentName,
				tool: toolName,
				result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw new BadRequestException(
				`Error executing tool ${toolName}: ${error.message}`
			);
		}
	}

	// Specialized agent tool execution methods for new categories
	async executeAITool(agentName: string, toolName: string, parameters: any) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		if (!agent.tools.includes(toolName)) {
			throw new BadRequestException(
				`AI tool ${toolName} is not available for agent ${agentName}`
			);
		}

		try {
			const result = await this.toolsService.executeTool({
				toolName,
				parameters,
				userId: parameters.userId,
			});

			return {
				agent: agentName,
				tool: toolName,
				category: 'AI_TOOLS',
				result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw new BadRequestException(
				`Error executing AI tool ${toolName}: ${error.message}`
			);
		}
	}

	async executeDataProcessingTool(
		agentName: string,
		toolName: string,
		parameters: any
	) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		if (!agent.tools.includes(toolName)) {
			throw new BadRequestException(
				`Data processing tool ${toolName} is not available for agent ${agentName}`
			);
		}

		try {
			const result = await this.toolsService.executeTool({
				toolName,
				parameters,
				userId: parameters.userId,
			});

			return {
				agent: agentName,
				tool: toolName,
				category: 'DATA_PROCESSING',
				result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw new BadRequestException(
				`Error executing data processing tool ${toolName}: ${error.message}`
			);
		}
	}

	async executeWebAutomationTool(
		agentName: string,
		toolName: string,
		parameters: any
	) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		if (!agent.tools.includes(toolName)) {
			throw new BadRequestException(
				`Web automation tool ${toolName} is not available for agent ${agentName}`
			);
		}

		try {
			const result = await this.toolsService.executeTool({
				toolName,
				parameters,
				userId: parameters.userId,
			});

			return {
				agent: agentName,
				tool: toolName,
				category: 'WEB_AUTOMATION',
				result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw new BadRequestException(
				`Error executing web automation tool ${toolName}: ${error.message}`
			);
		}
	}

	async executeCodeExecutionTool(
		agentName: string,
		toolName: string,
		parameters: any
	) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		if (!agent.tools.includes(toolName)) {
			throw new BadRequestException(
				`Code execution tool ${toolName} is not available for agent ${agentName}`
			);
		}

		try {
			const result = await this.toolsService.executeTool({
				toolName,
				parameters,
				userId: parameters.userId,
			});

			return {
				agent: agentName,
				tool: toolName,
				category: 'CODE_EXECUTION',
				result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw new BadRequestException(
				`Error executing code execution tool ${toolName}: ${error.message}`
			);
		}
	}

	// Enhanced agent suggestion with new categories
	async getAgentsByCategory(category: string) {
		const allAgents = await this.getAllAgents();
		return allAgents.filter((agent) => agent.category === category);
	}

	async getAgentToolsByCategory(agentName: string, toolCategory?: string) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		const agentTools = agent.tools
			.map((toolName) => this.toolsService.getToolInfo(toolName))
			.filter((tool) => tool !== null);

		if (toolCategory) {
			return agentTools.filter((tool) => tool.category === toolCategory);
		}

		return agentTools;
	}

	private getAgentCategory(agentName: string): string {
		const categoryMap = {
			artistic_inspiration_agent: 'Art & Creativity',
			career_planning_agent: 'Career Development',
			customer_service_agent: 'Customer Service',
			email_management_agent: 'Email Management',
			learning_platform_agent: 'Online Learning',
			stress_management_agent: 'Stress Management',
			recommendation_agent: 'Content Recommendation',
			video_editing_agent: 'Video Editing',
			general_assistant_agent: 'Multi-purpose Assistant',
			// New specialized agents
			full_stack_developer_agent: 'Software Development',
			security_analyst_agent: 'Security & Compliance',
			devops_automation_agent: 'DevOps & Infrastructure',
			research_assistant_agent: 'Research & Analysis',
			data_scientist_agent: 'Data Science & Analytics',
			content_creator_agent: 'Content Creation',
			business_analyst_agent: 'Business Intelligence',
			project_manager_agent: 'Project Management',
		};

		return categoryMap[agentName] || 'Other';
	}

	private generateConversationId(): string {
		return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Support methods for special tasks
	async getAgentCapabilities(agentName: string) {
		const agent = getAgentByName(agentName);
		if (!agent) {
			throw new NotFoundException(`Agent ${agentName} does not exist`);
		}

		const capabilities = [];

		// Analyze capabilities based on tools
		for (const toolName of agent.tools) {
			const tool = this.toolsService.getToolInfo(toolName);
			if (tool) {
				capabilities.push({
					name: tool.name,
					description: tool.description,
					category: tool.category,
					schema: tool.schema,
				});
			}
		}

		return {
			agent: agentName,
			description: agent.description,
			capabilities,
			systemPrompt: agent.systemPrompt,
			settings: {
				temperature: agent.temperature || 0.7,
				maxTokens: agent.maxTokens || 2000,
			},
		};
	}

	async suggestAgent(userQuery: string) {
		// Analyze query to recommend suitable agent
		const keywords = userQuery.toLowerCase();

		const suggestions = [];

		if (
			keywords.includes('art') ||
			keywords.includes('creative') ||
			keywords.includes('art')
		) {
			suggestions.push('artistic_inspiration_agent');
		}

		if (
			keywords.includes('career') ||
			keywords.includes('career') ||
			keywords.includes('job')
		) {
			suggestions.push('career_planning_agent');
		}

		if (
			keywords.includes('customer') ||
			keywords.includes('support') ||
			keywords.includes('support')
		) {
			suggestions.push('customer_service_agent');
		}

		if (keywords.includes('email') || keywords.includes('email')) {
			suggestions.push('email_management_agent');
		}

		if (
			keywords.includes('learn') ||
			keywords.includes('course') ||
			keywords.includes('learning')
		) {
			suggestions.push('learning_platform_agent');
		}

		if (
			keywords.includes('stress') ||
			keywords.includes('stress') ||
			keywords.includes('psychology')
		) {
			suggestions.push('stress_management_agent');
		}

		if (
			keywords.includes('recommend') ||
			keywords.includes('recommendation') ||
			keywords.includes('suggest')
		) {
			suggestions.push('recommendation_agent');
		}

		if (keywords.includes('video') || keywords.includes('edit')) {
			suggestions.push('video_editing_agent');
		}

		// If no specific suggestions, recommend general agent
		if (suggestions.length === 0) {
			suggestions.push('general_assistant_agent');
		}

		return suggestions
			.map((agentName) => {
				const agent = getAgentByName(agentName);
				return {
					name: agentName,
					description: agent?.description,
					category: this.getAgentCategory(agentName),
					confidence: this.calculateConfidence(userQuery, agentName),
				};
			})
			.sort((a, b) => b.confidence - a.confidence);
	}

	private calculateConfidence(query: string, agentName: string): number {
		// Calculate confidence based on keywords
		const keywords = query.toLowerCase();
		let confidence = 0;

		const agentKeywords = {
			artistic_inspiration_agent: [
				'art',
				'creative',
				'art',
				'inspiration',
				'artwork',
			],
			career_planning_agent: [
				'career',
				'career',
				'job',
				'job',
				'skill',
				'skill',
			],
			customer_service_agent: [
				'customer',
				'support',
				'support',
				'customer',
				'help',
			],
			email_management_agent: ['email', 'mail', 'mail', 'send', 'send'],
			learning_platform_agent: [
				'learn',
				'course',
				'learning',
				'course',
				'education',
			],
			stress_management_agent: [
				'stress',
				'stress',
				'psychology',
				'mental',
				'wellness',
			],
			recommendation_agent: [
				'recommend',
				'recommendation',
				'suggest',
				'suggest',
			],
			video_editing_agent: ['video', 'edit', 'edit', 'trim', 'effect'],
			general_assistant_agent: [
				'search',
				'search',
				'translate',
				'translate',
				'general',
			],
		};

		const relevantKeywords = agentKeywords[agentName] || [];

		for (const keyword of relevantKeywords) {
			if (keywords.includes(keyword)) {
				confidence += 0.2;
			}
		}

		return Math.min(confidence, 1.0);
	}
}
