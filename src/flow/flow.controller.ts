import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FlowService } from './flow.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';
import {
  FlowRegisterDto,
  FlowChatDto,
  FlowAgentTaskDto,
  FlowSessionDto,
  FlowAnalyticsDto,
  FlowUserProgressDto,
} from './dto/flow.dto';

@ApiTags('Flow')
@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  // Step 1: Complete User Registration Flow
  @Public()
  @Post('register/complete')
  @ApiOperation({
    summary: 'Complete user registration with profile setup',
    description: 'Register user, create profile, setup preferences, and initialize first chat session',
  })
  @ApiBody({ type: FlowRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration completed successfully with session initialized',
  })
  async completeRegistration(@Body() body: FlowRegisterDto) {
    try {
      const result = await this.flowService.completeUserRegistration(body);
      return new ApiResponseDto({
        statusCode: HttpStatus.CREATED,
        data: result,
        message: ApiMessageKey.CREATE_USER_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Step 2: Initialize Chat Session with Agent Selection
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('chat/initialize')
  @ApiOperation({
    summary: 'Initialize chat session with agent selection',
    description: 'Start chat session, select appropriate agent, and set up conversation context',
  })
  @ApiBody({ type: FlowChatDto })
  @ApiResponse({
    status: 200,
    description: 'Chat session initialized successfully',
  })
  async initializeChat(@Body() body: FlowChatDto) {
    try {
      const result = await this.flowService.initializeChatSession(body);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.CHAT_SESSION_INITIALIZED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Step 3: Execute Agent Task with Full Context
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('agent/execute')
  @ApiOperation({
    summary: 'Execute agent task with full user context',
    description: 'Execute any agent task with complete user profile, chat history, and preferences',
  })
  @ApiBody({ type: FlowAgentTaskDto })
  @ApiResponse({
    status: 200,
    description: 'Agent task executed successfully',
  })
  async executeAgentTask(@Body() body: FlowAgentTaskDto) {
    try {
      const result = await this.flowService.executeAgentWithContext(body);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.AGENT_TASK_COMPLETED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Step 4: Get User Flow Status and Progress
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('status/:userId')
  @ApiOperation({
    summary: 'Get complete user flow status',
    description: 'Get user registration status, active sessions, agent interactions, and progress',
  })
  @ApiResponse({
    status: 200,
    description: 'User flow status retrieved successfully',
  })
  async getUserFlowStatus(@Param('userId') userId: string) {
    try {
      const result = await this.flowService.getUserFlowStatus(userId);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.USER_FLOW_STATUS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Step 5: Complete Flow Session (Register -> Chat -> Agent Done)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('session/complete')
  @ApiOperation({
    summary: 'Complete full flow session',
    description: 'Mark session as complete, save results, update user progress, and generate analytics',
  })
  @ApiBody({ type: FlowSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Flow session completed successfully',
  })
  async completeFlowSession(@Body() body: FlowSessionDto) {
    try {
      const result = await this.flowService.completeFlowSession(body);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.FLOW_SESSION_COMPLETED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Analytics and Insights
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('analytics/:userId')
  @ApiOperation({
    summary: 'Get user flow analytics',
    description: 'Get comprehensive analytics on user interactions, agent usage, and completion rates',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getFlowAnalytics(
    @Param('userId') userId: string,
    @Query('timeframe') timeframe?: string,
    @Query('agentType') agentType?: string,
  ) {
    try {
      const result = await this.flowService.getFlowAnalytics(userId, {
        timeframe,
        agentType,
      });
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.ANALYTICS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // User Progress Tracking
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('progress/:userId')
  @ApiOperation({
    summary: 'Get user progress across all flows',
    description: 'Track user progress through different agent interactions and completion status',
  })
  @ApiResponse({
    status: 200,
    description: 'User progress retrieved successfully',
  })
  async getUserProgress(@Param('userId') userId: string) {
    try {
      const result = await this.flowService.getUserProgress(userId);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.USER_PROGRESS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Agent Recommendations Based on User History
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('recommendations/:userId')
  @ApiOperation({
    summary: 'Get personalized agent recommendations',
    description: 'Get AI-powered recommendations for next best agent based on user history and preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
  })
  async getAgentRecommendations(@Param('userId') userId: string) {
    try {
      const result = await this.flowService.getAgentRecommendations(userId);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.RECOMMENDATIONS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  // Batch Operations for Multiple Tasks
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('batch/execute')
  @ApiOperation({
    summary: 'Execute multiple agent tasks in sequence',
    description: 'Execute multiple agent tasks with dependency management and result chaining',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        tasks: {
          type: 'array',
          items: { $ref: '#/components/schemas/FlowAgentTaskDto' },
        },
        executionMode: {
          type: 'string',
          enum: ['sequential', 'parallel', 'conditional'],
          default: 'sequential',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch execution completed successfully',
  })
  async executeBatchTasks(@Body() body: {
    userId: string;
    tasks: FlowAgentTaskDto[];
    executionMode?: 'sequential' | 'parallel' | 'conditional';
  }) {
    try {
      const result = await this.flowService.executeBatchTasks(body);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.BATCH_EXECUTION_COMPLETED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }
}