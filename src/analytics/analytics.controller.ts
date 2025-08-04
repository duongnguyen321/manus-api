import {
	Controller,
	Get,
	Query,
	Param,
	UseGuards,
	HttpStatus,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger';
import {
	AnalyticsData,
	AnalyticsService,
	SystemMetrics,
} from './analytics.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	@Get('system')
	@ApiOperation({
		summary: 'Get system analytics',
		description: 'Retrieve comprehensive system analytics and metrics',
	})
	@ApiQuery({
		name: 'timeRange',
		enum: ['1h', '24h', '7d', '30d'],
		required: false,
		description: 'Time range for analytics data',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'System analytics retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				totalUsers: { type: 'number' },
				activeUsers: { type: 'number' },
				totalChats: { type: 'number' },
				totalMessages: { type: 'number' },
				totalAgentExecutions: { type: 'number' },
				totalFiles: { type: 'number' },
				averageResponseTime: { type: 'number' },
				popularTools: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							count: { type: 'number' },
						},
					},
				},
				userEngagement: {
					type: 'object',
					properties: {
						dailyActiveUsers: { type: 'number' },
						weeklyActiveUsers: { type: 'number' },
						monthlyActiveUsers: { type: 'number' },
					},
				},
				systemHealth: {
					type: 'object',
					properties: {
						uptime: { type: 'number' },
						memoryUsage: { type: 'number' },
						cpuUsage: { type: 'number' },
						errorRate: { type: 'number' },
					},
				},
			},
		},
	})
	async getSystemAnalytics(
		@Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
	) {
		const analytics = await this.analyticsService.getSystemAnalytics(timeRange);
		return new ApiResponseDto<AnalyticsData>({
			statusCode: 200,
			data: analytics,
			message: ApiMessageKey.ANALYTICS_RETRIEVED_SUCCESS,
		});
	}

	@Get('user/:userId')
	@ApiOperation({
		summary: 'Get user analytics',
		description: 'Retrieve analytics data for a specific user',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: 'User ID',
	})
	@ApiQuery({
		name: 'timeRange',
		enum: ['1h', '24h', '7d', '30d'],
		required: false,
		description: 'Time range for analytics data',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'User analytics retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string' },
				totalChats: { type: 'number' },
				totalMessages: { type: 'number' },
				totalAgentExecutions: { type: 'number' },
				totalFiles: { type: 'number' },
				averageSessionDuration: { type: 'number' },
				mostUsedTools: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							count: { type: 'number' },
						},
					},
				},
				activityPattern: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							hour: { type: 'number' },
							count: { type: 'number' },
						},
					},
				},
				lastActive: { type: 'string', format: 'date-time' },
			},
		},
	})
	async getUserAnalytics(
		@Param('userId') userId: string,
		@Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '7d'
	) {
		const userAnalytics = await this.analyticsService.getUserAnalytics(
			userId,
			timeRange
		);
		return new ApiResponseDto<AnalyticsData>({
			statusCode: 200,
			data: userAnalytics,
			message: ApiMessageKey.ANALYTICS_RETRIEVED_SUCCESS,
		});
	}

	@Get('user/me')
	@ApiOperation({
		summary: 'Get current user analytics',
		description: 'Retrieve analytics data for the authenticated user',
	})
	@ApiQuery({
		name: 'timeRange',
		enum: ['1h', '24h', '7d', '30d'],
		required: false,
		description: 'Time range for analytics data',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Current user analytics retrieved successfully',
	})
	async getCurrentUserAnalytics(
		@GetUser() user: User,
		@Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '7d'
	) {
		const userAnalytics = await this.analyticsService.getUserAnalytics(
			user.id,
			timeRange
		);
		return new ApiResponseDto<AnalyticsData>({
			statusCode: 200,
			data: userAnalytics,
			message: ApiMessageKey.ANALYTICS_RETRIEVED_SUCCESS,
		});
	}

	@Get('metrics')
	@ApiOperation({
		summary: 'Get system metrics',
		description: 'Retrieve real-time system performance metrics',
	})
	@ApiQuery({
		name: 'limit',
		type: 'number',
		required: false,
		description: 'Number of metric points to retrieve (default: 100)',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'System metrics retrieved successfully',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					timestamp: { type: 'string', format: 'date-time' },
					activeConnections: { type: 'number' },
					requestsPerMinute: { type: 'number' },
					responseTime: { type: 'number' },
					errorCount: { type: 'number' },
					memoryUsage: { type: 'number' },
					cpuUsage: { type: 'number' },
				},
			},
		},
	})
	async getSystemMetrics(@Query('limit') limit: number = 100) {
		const systemMetrics = await this.analyticsService.getSystemMetrics(limit);
		return new ApiResponseDto<SystemMetrics[]>({
			statusCode: 200,
			data: systemMetrics,
			message: ApiMessageKey.ANALYTICS_RETRIEVED_SUCCESS,
		});
	}

	@Get('reports/:type')
	@ApiOperation({
		summary: 'Generate analytics report',
		description: 'Generate a comprehensive analytics report',
	})
	@ApiParam({
		name: 'type',
		enum: ['daily', 'weekly', 'monthly'],
		description: 'Report type',
	})
	@ApiQuery({
		name: 'date',
		type: 'string',
		required: false,
		description: 'Date for the report (ISO string, defaults to current date)',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Analytics report generated successfully',
		schema: {
			type: 'object',
			properties: {
				type: { type: 'string' },
				period: {
					type: 'object',
					properties: {
						start: { type: 'string', format: 'date-time' },
						end: { type: 'string', format: 'date-time' },
					},
				},
				summary: {
					type: 'object',
					properties: {
						totalUsers: { type: 'number' },
						totalChats: { type: 'number' },
						totalMessages: { type: 'number' },
						averageResponseTime: { type: 'number' },
					},
				},
				trends: { type: 'object' },
				recommendations: { type: 'array', items: { type: 'string' } },
				generatedAt: { type: 'string', format: 'date-time' },
			},
		},
	})
	async generateReport(
		@Param('type') type: 'daily' | 'weekly' | 'monthly',
		@Query('date') date?: string
	) {
		const reportDate = date ? new Date(date) : new Date();
		const report = await this.analyticsService.generateReport(type, reportDate);
		return new ApiResponseDto<any>({
			statusCode: 200,
			data: report,
			message: ApiMessageKey.ANALYTICS_RETRIEVED_SUCCESS,
		});
	}
}
