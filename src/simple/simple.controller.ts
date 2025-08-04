import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	UseGuards,
	Request,
	HttpStatus,
	NotFoundException,
	BadRequestException,
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
import { ApiMessageKey } from '@/common/constants/message.constants';
import { ApiResponseDto } from '@/common/classes/response.dto';

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

		return new ApiResponseDto({
			statusCode: HttpStatus.OK,
			data: sessionId,
			message: ApiMessageKey.CHAT_SESSION_INITIALIZED_SUCCESS,
			pagination: null,
		});
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
						'Go to https://duonguyen.site/blogs and tell me the top 3 blogs',
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
		const response = await this.simpleService.chat({
			message: chatDto.message,
			sessionId: chatDto.sessionId,
			userId,
		});
		return new ApiResponseDto({
			statusCode: HttpStatus.OK,
			data: response,
			message: ApiMessageKey.CHAT_COMPLETED_SUCCESS,
			pagination: null,
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
			throw new NotFoundException('Session chat not found');
		}

		return new ApiResponseDto({
			statusCode: HttpStatus.OK,
			data: session,
			message: ApiMessageKey.GET_SESSION_LIST_SUCCESS,
			pagination: null,
		});
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
			throw new NotFoundException('Session chat not found');
		}

		return new ApiResponseDto({
			statusCode: HttpStatus.OK,
			data: session,
			message: ApiMessageKey.GET_SESSION_SUCCESS,
			pagination: null,
		});
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
		if (!success) {
			throw new BadRequestException('Failed to delete session');
		}
		return new ApiResponseDto({
			statusCode: HttpStatus.OK,
			data: {
				success,
				sessionId,
			},
			message: ApiMessageKey.DELETE_SESSION_SUCCESS,
			pagination: null,
		});
	}
}
