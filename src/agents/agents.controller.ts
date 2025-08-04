import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AgentsService } from './agents.service';

import {
	ChatRequestDto,
	ToolExecutionDto,
	AgentListDto,
} from './dto/agents.dto';
import { ToolsService } from './tools.service';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
	constructor(
		private readonly agentsService: AgentsService,
		private readonly toolsService: ToolsService
	) {}

	@Get()
	@ApiOperation({ summary: 'Get list of all agents' })
	@ApiResponse({
		status: 200,
		description: 'List of agents',
		type: [AgentListDto],
	})
	async getAllAgents(): Promise<AgentListDto[]> {
		return this.agentsService.getAllAgents();
	}

	@Get(':agentName')
	@ApiOperation({ summary: 'Get detailed information of an agent' })
	@ApiResponse({ status: 200, description: 'Agent information' })
	async getAgentInfo(@Param('agentName') agentName: string) {
		return this.agentsService.getAgentInfo(agentName);
	}

	@Post(':agentName/chat')
	@ApiOperation({ summary: 'Chat with a specific agent' })
	@ApiBody({ type: ChatRequestDto })
	@ApiResponse({ status: 200, description: 'Response from agent' })
	async chatWithAgent(
		@Param('agentName') agentName: string,
		@Body() chatRequest: ChatRequestDto
	) {
		return this.agentsService.chatWithAgent(agentName, chatRequest);
	}

	@Post('tools/execute')
	@ApiTags('Tools')
	@ApiOperation({ 
		summary: 'Execute a specific AI tool',
		description: 'Execute any specialized AI tool with parameters using LangChain integration'
	})
	@ApiBody({ type: ToolExecutionDto })
	@ApiResponse({ 
		status: 200, 
		description: 'Tool execution result',
		schema: {
			type: 'object',
			properties: {
				result: { type: 'string', description: 'Tool execution output' },
				toolName: { type: 'string', description: 'Name of executed tool' },
				executionTime: { type: 'number', description: 'Execution time in milliseconds' },
				timestamp: { type: 'string', format: 'date-time' }
			}
		}
	})
	async executeTool(@Body() toolExecution: ToolExecutionDto) {
		return this.toolsService.executeTool(toolExecution);
	}

	@Get('tools/list')
	@ApiTags('Tools')
	@ApiOperation({ 
		summary: 'Get list of all available AI tools',
		description: 'Retrieve a comprehensive list of all specialized AI tools with their capabilities and requirements'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'List of available tools',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string', description: 'Tool name' },
					description: { type: 'string', description: 'Tool description' },
					category: { type: 'string', description: 'Tool category' },
					parameters: { type: 'object', description: 'Required parameters schema' },
					agentRequired: { type: 'string', description: 'Required agent for this tool' }
				}
			}
		}
	})
	async getAllTools(@Query('category') category?: string) {
		return this.toolsService.getAllTools(category);
	}

	@Get('tools/:toolName')
	@ApiTags('Tools')
	@ApiOperation({ 
		summary: 'Get detailed information about a specific AI tool',
		description: 'Get comprehensive details about a specific tool including usage examples and parameter specifications'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Detailed tool information',
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Tool name' },
				description: { type: 'string', description: 'Detailed tool description' },
				category: { type: 'string', description: 'Tool category' },
				parameters: { 
					type: 'object', 
					description: 'Complete parameter schema with validation rules' 
				},
				examples: { 
					type: 'array', 
					items: { type: 'object' },
					description: 'Usage examples'
				},
				agentRequired: { type: 'string', description: 'Required agent for this tool' },
				capabilities: { type: 'array', items: { type: 'string' }, description: 'Tool capabilities' }
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Tool not found' })
	async getToolInfo(@Param('toolName') toolName: string) {
		return this.toolsService.getToolInfo(toolName);
	}

	@Post('artistic-inspiration/search')
	@ApiOperation({ summary: 'Search artworks' })
	async searchArtworks(@Body() searchParams: any) {
		return this.agentsService.executeAgentTool(
			'artistic_inspiration_agent',
			'search_artworks',
			searchParams
		);
	}

	@Post('career-planning/assess-skills')
	@ApiOperation({ summary: 'Assess professional skills' })
	async assessSkills(@Body() assessmentData: any) {
		return this.agentsService.executeAgentTool(
			'career_planning_agent',
			'assess_skills',
			assessmentData
		);
	}

	@Post('customer-service/handle-inquiry')
	@ApiOperation({ summary: 'Handle customer questions' })
	async handleInquiry(@Body() inquiryData: any) {
		return this.agentsService.executeAgentTool(
			'customer_service_agent',
			'handle_inquiry',
			inquiryData
		);
	}

	@Post('email-management/compose')
	@ApiOperation({ summary: 'Compose email' })
	async composeEmail(@Body() emailData: any) {
		return this.agentsService.executeAgentTool(
			'email_management_agent',
			'compose_email',
			emailData
		);
	}

	@Post('learning-platform/enroll')
	@ApiOperation({ summary: 'Register for course' })
	async enrollCourse(@Body() enrollmentData: any) {
		return this.agentsService.executeAgentTool(
			'learning_platform_agent',
			'enroll_course',
			enrollmentData
		);
	}

	@Post('stress-management/assess')
	@ApiOperation({ summary: 'Assess stress level' })
	async assessStress(@Body() stressData: any) {
		return this.agentsService.executeAgentTool(
			'stress_management_agent',
			'assess_stress_level',
			stressData
		);
	}

	@Post('recommendation/get-content')
	@ApiOperation({ summary: 'Get content recommendations' })
	async getRecommendations(@Body() recommendationData: any) {
		return this.agentsService.executeAgentTool(
			'recommendation_agent',
			'get_content_recommendations',
			recommendationData
		);
	}

	@Post('video-editing/trim')
	@ApiOperation({ summary: 'Trim video' })
	async trimVideo(@Body() videoData: any) {
		return this.agentsService.executeAgentTool(
			'video_editing_agent',
			'trim_video',
			videoData
		);
	}

	@Post('general/search-web')
	@ApiOperation({ summary: 'Web search' })
	async searchWeb(@Body() searchData: any) {
		return this.agentsService.executeAgentTool(
			'general_assistant_agent',
			'search_web',
			searchData
		);
	}

	@Post('general/generate-text')
	@ApiOperation({ summary: 'Generate text with AI' })
	async generateText(@Body() textData: any) {
		return this.agentsService.executeAgentTool(
			'general_assistant_agent',
			'generate_text',
			textData
		);
	}

	@Post('general/translate')
	@ApiOperation({ summary: 'Translate text' })
	async translateText(@Body() translationData: any) {
		return this.agentsService.executeAgentTool(
			'general_assistant_agent',
			'translate_text',
			translationData
		);
	}
}
