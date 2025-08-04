import {
	Injectable,
	NotFoundException,
	BadRequestException,
	Logger,
} from '@nestjs/common';
import { ToolExecutionDto } from './dto/agents.dto';
import {
	allTools,
	getToolByName,
	getToolsByCategory,
	ToolCategory,
} from '@/common/config/tools.config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ToolsService {
	private readonly logger = new Logger(ToolsService.name);

	constructor(private readonly prismaService: PrismaService) {}
	async getAllTools(category?: string) {
		if (category) {
			const toolCategory = category.toUpperCase() as ToolCategory;
			if (Object.values(ToolCategory).includes(toolCategory)) {
				return getToolsByCategory(toolCategory).map((tool) => ({
					name: tool.name,
					description: tool.description,
					category: tool.category,
					schema: tool.schema,
					requiresAuth: tool.requiresAuth || false,
				}));
			}
		}

		return allTools.map((tool) => ({
			name: tool.name,
			description: tool.description,
			category: tool.category,
			schema: tool.schema,
			requiresAuth: tool.requiresAuth || false,
		}));
	}

	getToolInfo(toolName: string) {
		const tool = getToolByName(toolName);
		if (!tool) {
			return null;
		}

		return {
			name: tool.name,
			description: tool.description,
			category: tool.category,
			schema: tool.schema,
			requiresAuth: tool.requiresAuth || false,
			permissions: tool.permissions || [],
		};
	}

	async executeTool(toolExecution: ToolExecutionDto) {
		const tool = getToolByName(toolExecution.toolName);
		if (!tool) {
			throw new NotFoundException(
				`Tool ${toolExecution.toolName} does not exist`
			);
		}

		const executionStart = Date.now();

		try {
			// Validate parameters against schema if available
			if (tool.schema) {
				this.validateParameters(toolExecution.parameters, tool.schema);
			}

			// Execute the tool
			const result = await tool.handler(toolExecution.parameters);

			const executionTime = Date.now() - executionStart;

			// Record tool usage for analytics
			await this.recordToolUsage({
				toolName: toolExecution.toolName,
				userId: toolExecution.userId,
				parameters: toolExecution.parameters,
				result,
				executionTime,
				success: true,
			});

			return {
				tool: toolExecution.toolName,
				result,
				timestamp: new Date().toISOString(),
				userId: toolExecution.userId,
				executionTime,
			};
		} catch (error) {
			const executionTime = Date.now() - executionStart;
			
			// Record failed tool usage
			await this.recordToolUsage({
				toolName: toolExecution.toolName,
				userId: toolExecution.userId,
				parameters: toolExecution.parameters,
				result: null,
				executionTime,
				success: false,
				error: error.message,
			});

			throw new BadRequestException(
				`Error executing tool ${toolExecution.toolName}: ${error.message}`
			);
		}
	}

	private validateParameters(parameters: any, schema: any): void {
		if (!schema || !schema.properties) {
			return;
		}

		const required = schema.required || [];

		// Check required parameters
		for (const requiredParam of required) {
			if (!(requiredParam in parameters)) {
				throw new BadRequestException(
					`Missing required parameter: ${requiredParam}`
				);
			}
		}

		// Validate parameter types
		for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
			if (paramName in parameters) {
				this.validateParameterType(
					parameters[paramName],
					paramSchema as any,
					paramName
				);
			}
		}
	}

	private validateParameterType(
		value: any,
		schema: any,
		paramName: string
	): void {
		const { type } = schema;

		switch (type) {
			case 'string':
				if (typeof value !== 'string') {
					throw new BadRequestException(`Parameter ${paramName} must be a string`);
				}
				break;
			case 'number':
				if (typeof value !== 'number') {
					throw new BadRequestException(`Parameter ${paramName} must be a number`);
				}
				break;
			case 'boolean':
				if (typeof value !== 'boolean') {
					throw new BadRequestException(`Parameter ${paramName} must be a boolean`);
				}
				break;
			case 'array':
				if (!Array.isArray(value)) {
					throw new BadRequestException(`Parameter ${paramName} must be an array`);
				}
				break;
			case 'object':
				if (typeof value !== 'object' || value === null) {
					throw new BadRequestException(`Parameter ${paramName} must be an object`);
				}
				break;
		}
	}

	// Specialized tool execution methods for different categories

	async executeArtisticTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.ARTISTIC_INSPIRATION) {
			throw new NotFoundException(`Artistic tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeCareerTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.CAREER_PLANNING) {
			throw new NotFoundException(`Career tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeCustomerServiceTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.CUSTOMER_SERVICE) {
			throw new NotFoundException(
				`Customer service tool ${toolName} does not exist`
			);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeEmailTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.EMAIL_MANAGEMENT) {
			throw new NotFoundException(`Email tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeLearningTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.LEARNING_PLATFORM) {
			throw new NotFoundException(`Learning tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeStressTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.STRESS_MANAGEMENT) {
			throw new NotFoundException(
				`Stress management tool ${toolName} does not exist`
			);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeRecommendationTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.RECOMMENDATION) {
			throw new NotFoundException(
				`Recommendation tool ${toolName} does not exist`
			);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeVideoTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.VIDEO_EDITING) {
			throw new NotFoundException(
				`Video editing tool ${toolName} does not exist`
			);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeGeneralTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.GENERAL) {
			throw new NotFoundException(`General tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeAITool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.AI_TOOLS) {
			throw new NotFoundException(`AI tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeDataProcessingTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.DATA_PROCESSING) {
			throw new NotFoundException(`Data processing tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeWebAutomationTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.WEB_AUTOMATION) {
			throw new NotFoundException(`Web automation tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	async executeCodeExecutionTool(toolName: string, parameters: any) {
		const tool = getToolByName(toolName);
		if (!tool || tool.category !== ToolCategory.CODE_EXECUTION) {
			throw new NotFoundException(`Code execution tool ${toolName} does not exist`);
		}

		return this.executeTool({
			toolName,
			parameters,
			userId: parameters.userId,
		});
	}

	// Tool discovery and recommendation methods

	async getToolsByCategory(category: ToolCategory) {
		return getToolsByCategory(category).map((tool) => ({
			name: tool.name,
			description: tool.description,
			schema: tool.schema,
			requiresAuth: tool.requiresAuth || false,
		}));
	}

	async searchTools(query: string) {
		const searchTerm = query.toLowerCase();

		return allTools
			.filter(
				(tool) =>
					tool.name.toLowerCase().includes(searchTerm) ||
					tool.description.toLowerCase().includes(searchTerm)
			)
			.map((tool) => ({
				name: tool.name,
				description: tool.description,
				category: tool.category,
				relevanceScore: this.calculateRelevance(tool, searchTerm),
			}))
			.sort((a, b) => b.relevanceScore - a.relevanceScore);
	}

	private calculateRelevance(tool: any, searchTerm: string): number {
		let score = 0;

		if (tool.name.toLowerCase().includes(searchTerm)) {
			score += 0.6;
		}

		if (tool.description.toLowerCase().includes(searchTerm)) {
			score += 0.4;
		}

		return score;
	}

	async getToolUsageStats() {
		try {
			// Get real tool usage statistics from database
			const [totalExecutions, toolExecutions, recentExecutions] = await Promise.all([
				this.prismaService.agentExecution.count(),
				this.prismaService.agentExecution.groupBy({
					by: ['toolName'],
					_count: { toolName: true },
					orderBy: { _count: { toolName: 'desc' } },
					take: 10,
				}),
				this.prismaService.agentExecution.findMany({
					where: {
						createdAt: {
							gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
						},
					},
					select: {
						toolName: true,
						status: true,
						duration: true,
					},
				}),
			]);

			const mostUsedTools = toolExecutions.map(exec => ({
				name: exec.toolName,
				count: exec._count.toolName,
			}));

			const avgExecutionTime = recentExecutions.length > 0 
				? recentExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / recentExecutions.length
				: 0;

			const successRate = recentExecutions.length > 0 
				? (recentExecutions.filter(exec => exec.status === 'completed').length / recentExecutions.length) * 100
				: 0;

			return {
				totalTools: allTools.length,
				totalExecutions,
				categoryCounts: {
					[ToolCategory.ARTISTIC_INSPIRATION]: getToolsByCategory(ToolCategory.ARTISTIC_INSPIRATION).length,
					[ToolCategory.CAREER_PLANNING]: getToolsByCategory(ToolCategory.CAREER_PLANNING).length,
					[ToolCategory.CUSTOMER_SERVICE]: getToolsByCategory(ToolCategory.CUSTOMER_SERVICE).length,
					[ToolCategory.EMAIL_MANAGEMENT]: getToolsByCategory(ToolCategory.EMAIL_MANAGEMENT).length,
					[ToolCategory.LEARNING_PLATFORM]: getToolsByCategory(ToolCategory.LEARNING_PLATFORM).length,
					[ToolCategory.STRESS_MANAGEMENT]: getToolsByCategory(ToolCategory.STRESS_MANAGEMENT).length,
					[ToolCategory.RECOMMENDATION]: getToolsByCategory(ToolCategory.RECOMMENDATION).length,
					[ToolCategory.VIDEO_EDITING]: getToolsByCategory(ToolCategory.VIDEO_EDITING).length,
					[ToolCategory.GENERAL]: getToolsByCategory(ToolCategory.GENERAL).length,
					[ToolCategory.AI_TOOLS]: getToolsByCategory(ToolCategory.AI_TOOLS).length,
					[ToolCategory.DATA_PROCESSING]: getToolsByCategory(ToolCategory.DATA_PROCESSING).length,
					[ToolCategory.WEB_AUTOMATION]: getToolsByCategory(ToolCategory.WEB_AUTOMATION).length,
					[ToolCategory.CODE_EXECUTION]: getToolsByCategory(ToolCategory.CODE_EXECUTION).length,
				},
				mostUsedTools: mostUsedTools.map(tool => tool.name),
				usageDetails: mostUsedTools,
				avgExecutionTime: Math.round(avgExecutionTime),
				successRate: Math.round(successRate * 100) / 100,
				last24Hours: recentExecutions.length,
			};
		} catch (error) {
			this.logger.error(`Failed to get tool usage stats: ${error.message}`);
			// Fallback to basic stats if database query fails
			return {
				totalTools: allTools.length,
				totalExecutions: 0,
				categoryCounts: Object.values(ToolCategory).reduce((acc, category) => {
					acc[category] = getToolsByCategory(category).length;
					return acc;
				}, {} as Record<ToolCategory, number>),
				mostUsedTools: [],
				avgExecutionTime: 0,
				successRate: 0,
				last24Hours: 0,
			};
		}
	}

	private async recordToolUsage(params: {
		toolName: string;
		userId: string;
		parameters: any;
		result: any;
		executionTime: number;
		success: boolean;
		error?: string;
	}) {
		try {
			await this.prismaService.agentExecution.create({
				data: {
					executionId: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					toolName: params.toolName,
					userId: params.userId,
					input: params.parameters,
					output: params.result,
					duration: params.executionTime,
					status: params.success ? 'completed' : 'failed',
					error: params.error,
					completedAt: new Date(),
					metadata: {
						category: getToolByName(params.toolName)?.category || 'unknown',
						timestamp: new Date().toISOString(),
					},
				},
			});
		} catch (error) {
			this.logger.error(`Failed to record tool usage: ${error.message}`);
			// Don't throw error here to avoid breaking tool execution
		}
	}
}
