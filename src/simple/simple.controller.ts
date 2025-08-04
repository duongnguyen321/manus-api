import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	UseGuards,
	Request,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiBearerAuth,
	ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

import { SimpleService } from './simple.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

export class SimpleChatDto {
	@ApiProperty({
		description: 'Message to send to AI assistant',
		example: 'Hello! Can you help me with some Python code?',
	})
	@IsString()
	@IsNotEmpty()
	message: string;

	@ApiProperty({
		description: 'Optional session ID to continue existing conversation',
		example: 'simple_1234567890_abc123',
		required: false,
	})
	@IsOptional()
	@IsString()
	sessionId?: string;
}

export class CreateSessionDto {
	// Empty body for session creation
}

@ApiTags('Simple AI API')
@Controller('simple')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SimpleController {
	constructor(private readonly simpleService: SimpleService) {}

	@Post('sessions')
	@ApiOperation({
		summary: 'Create new simple AI session',
		description:
			'Create a new session for streamlined AI interaction. Session automatically manages Docker containers and browser contexts.',
	})
	@ApiBody({ type: CreateSessionDto })
	@ApiResponse({
		status: 200,
		description: 'Session created successfully',
		schema: {
			type: 'object',
			properties: {
				sessionId: { type: 'string', description: 'Unique session identifier' },
				message: { type: 'string' },
				created: { type: 'string', format: 'date-time' },
			},
		},
	})
	async createSession(@GetUser('id') userId: string) {
		const sessionId = await this.simpleService.createSession(userId);

		return {
			sessionId,
			message:
				'Simple AI session created. You can now chat, execute code, browse web, and more!',
			created: new Date().toISOString(),
		};
	}

	@Post('chat')
	@ApiOperation({
		summary: 'Chat with AI using simple interface',
		description:
			'Send a message to AI and get intelligent response with automatic tool usage. AI can execute code, browse web, manage files, and more based on your request.',
	})
	@ApiBody({
		type: SimpleChatDto,
		examples: {
			basicChat: {
				summary: 'Basic conversation',
				value: {
					message: 'Hello! Can you help me with some Python code?',
					sessionId: 'simple_1234567890_abc123',
				},
			},
			codeExecution: {
				summary: 'Code execution request',
				value: {
					message:
						'Write a Python script to calculate fibonacci numbers and run it',
					sessionId: 'simple_1234567890_abc123',
				},
			},
			webBrowsing: {
				summary: 'Web browsing request',
				value: {
					message:
						'Go to https://news.ycombinator.com and tell me the top 3 stories',
					sessionId: 'simple_1234567890_abc123',
				},
			},
			dataAnalysis: {
				summary: 'Data processing',
				value: {
					message: 'Create a CSV file with sample sales data and analyze it',
					sessionId: 'simple_1234567890_abc123',
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: 'AI response with tool execution results',
		schema: {
			type: 'object',
			properties: {
				response: { type: 'string', description: 'AI response message' },
				sessionId: { type: 'string', description: 'Session identifier' },
				toolsUsed: {
					type: 'array',
					items: { type: 'string' },
					description: 'List of tools used by AI',
				},
				executionTime: {
					type: 'number',
					description: 'Response time in milliseconds',
				},
				timestamp: { type: 'string', format: 'date-time' },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request or session not found',
	})
	async chat(@Body() chatDto: SimpleChatDto, @GetUser('id') userId: string) {
		return this.simpleService.chat({
			message: chatDto.message,
			sessionId: chatDto.sessionId,
			userId,
		});
	}

	@Get('sessions')
	@ApiOperation({
		summary: 'Get session list',
		description:
			'Retrieve session list information including message history and active resources',
	})
	@ApiResponse({
		status: 200,
		description: 'Session list',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					userId: { type: 'string' },
					messages: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								role: { type: 'string', enum: ['user', 'assistant', 'system'] },
								content: { type: 'string' },
								timestamp: { type: 'string', format: 'date-time' },
								toolCalls: { type: 'array' },
							},
						},
					},
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					dockerContainers: { type: 'array', items: { type: 'string' } },
					browserContext: { type: 'string', nullable: true },
				},
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: 'Session not found',
	})
	async getSessionList(@GetUser('id') userId: string) {
		const session = await this.simpleService.getSessionList(userId);

		if (!session) {
			return {
				error: 'Session not found',
				userId,
			};
		}

		return session;
	}

	@Get('sessions/:sessionId')
	@ApiOperation({
		summary: 'Get session details',
		description:
			'Retrieve session information including message history and active resources',
	})
	@ApiResponse({
		status: 200,
		description: 'Session details',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				userId: { type: 'string' },
				messages: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							role: { type: 'string', enum: ['user', 'assistant', 'system'] },
							content: { type: 'string' },
							timestamp: { type: 'string', format: 'date-time' },
							toolCalls: { type: 'array' },
						},
					},
				},
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' },
				dockerContainers: { type: 'array', items: { type: 'string' } },
				browserContext: { type: 'string', nullable: true },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: 'Session not found',
	})
	async getSession(@Param('sessionId') sessionId: string) {
		const session = await this.simpleService.getSession(sessionId);

		if (!session) {
			return {
				error: 'Session not found',
				sessionId,
			};
		}

		return session;
	}

	@Delete('sessions/:sessionId')
	@ApiOperation({
		summary: 'Delete session and cleanup resources',
		description:
			'Delete session and automatically cleanup all associated Docker containers and browser contexts',
	})
	@ApiResponse({
		status: 200,
		description: 'Session deleted successfully',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				message: { type: 'string' },
				sessionId: { type: 'string' },
			},
		},
	})
	async deleteSession(
		@Param('sessionId') sessionId: string,
		@GetUser('id') userId: string
	) {
		const success = await this.simpleService.deleteSession(sessionId, userId);

		return {
			success,
			message: success
				? 'Session deleted and resources cleaned up successfully'
				: 'Failed to delete session',
			sessionId,
		};
	}

	@Get('health')
	@ApiOperation({
		summary: 'Simple API health check',
		description:
			'Check if the simple API is running and ready to accept requests',
	})
	@ApiResponse({
		status: 200,
		description: 'Service is healthy',
		schema: {
			type: 'object',
			properties: {
				status: { type: 'string' },
				message: { type: 'string' },
				timestamp: { type: 'string', format: 'date-time' },
				capabilities: {
					type: 'array',
					items: { type: 'string' },
				},
			},
		},
	})
	async health() {
		return {
			status: 'healthy',
			message: 'Simple AI API is running and ready',
			timestamp: new Date().toISOString(),
			capabilities: [
				'Natural language chat',
				'Code execution (Python, Node.js, Bash)',
				'Web browsing and scraping',
				'File operations',
				'Data processing',
				'Docker container management',
				'Session persistence',
				'Tool orchestration',
			],
		};
	}
}
