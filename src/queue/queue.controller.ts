import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { QueueService, QueueJobData } from './queue.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

@ApiTags('Queue Management')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('chat')
  @Public()
  @ApiOperation({ 
    summary: 'Add chat processing job',
    description: 'Adds a chat message to the processing queue for background AI processing' 
  })
  @ApiResponse({ status: 201, description: 'Chat job added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addChatJob(@Body() data: QueueJobData): Promise<ApiResponseDto<{ jobId: string }>> {
    const job = await this.queueService.addChatProcessingJob(data);
    return new ApiResponseDto({
      statusCode: HttpStatus.CREATED,
      data: { jobId: job.id.toString() },
      message: ApiMessageKey.QUEUE_JOB_CREATED_SUCCESS
    });
  }

  @Post('generate/:type')
  @Public()
  @ApiOperation({ 
    summary: 'Add generation job',
    description: 'Adds a content generation job (text, code, or image) to the processing queue' 
  })
  @ApiParam({ 
    name: 'type', 
    enum: ['text', 'code', 'image'], 
    description: 'Type of content to generate' 
  })
  @ApiResponse({ status: 201, description: 'Generation job added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addGenerationJob(
    @Param('type') type: 'text' | 'code' | 'image',
    @Body() data: QueueJobData,
  ): Promise<ApiResponseDto<{ jobId: string }>> {
    const job = await this.queueService.addGenerationJob(type, data);
    return new ApiResponseDto({
      statusCode: HttpStatus.CREATED,
      data: { jobId: job.id.toString() },
      message: ApiMessageKey.QUEUE_JOB_CREATED_SUCCESS
    });
  }

  @Post('browser')
  @Public()
  @ApiOperation({ 
    summary: 'Add browser automation job',
    description: 'Adds a browser automation task to the processing queue' 
  })
  @ApiResponse({ status: 201, description: 'Browser job added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addBrowserJob(@Body() data: QueueJobData): Promise<ApiResponseDto<{ jobId: string }>> {
    const job = await this.queueService.addBrowserAutomationJob(data);
    return new ApiResponseDto({
      statusCode: HttpStatus.CREATED,
      data: { jobId: job.id.toString() },
      message: ApiMessageKey.QUEUE_JOB_CREATED_SUCCESS
    });
  }

  @Post('edit')
  @Public()
  @ApiOperation({ 
    summary: 'Add file editing job',
    description: 'Adds a file editing task to the processing queue' 
  })
  @ApiResponse({ status: 201, description: 'Edit job added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addEditJob(@Body() data: QueueJobData): Promise<ApiResponseDto<{ jobId: string }>> {
    const job = await this.queueService.addEditJob(data);
    return new ApiResponseDto({
      statusCode: HttpStatus.CREATED,
      data: { jobId: job.id.toString() },
      message: ApiMessageKey.QUEUE_JOB_CREATED_SUCCESS
    });
  }

  @Post('system')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Add system task job',
    description: 'Adds a system maintenance or administrative task to the processing queue' 
  })
  @ApiResponse({ status: 201, description: 'System job added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addSystemJob(@Body() data: QueueJobData): Promise<ApiResponseDto<{ jobId: string }>> {
    const job = await this.queueService.addSystemJob(data);
    return new ApiResponseDto({
      statusCode: HttpStatus.CREATED,
      data: { jobId: job.id.toString() },
      message: ApiMessageKey.QUEUE_JOB_CREATED_SUCCESS
    });
  }

  @Get('job/:jobId')
  @Public()
  @ApiOperation({ 
    summary: 'Get job status',
    description: 'Retrieves detailed status information for a specific job' 
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<ApiResponseDto<any>> {
    const jobStatus = await this.queueService.getJobStatus(jobId);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: jobStatus,
      message: ApiMessageKey.QUEUE_JOB_STATUS_RETRIEVED_SUCCESS
    });
  }

  @Get('session/:sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Get session jobs',
    description: 'Retrieves all jobs associated with a specific session' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session jobs retrieved successfully' })
  async getSessionJobs(@Param('sessionId') sessionId: string): Promise<ApiResponseDto<any[]>> {
    const sessionJobs = await this.queueService.getSessionJobs(sessionId);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: sessionJobs,
      message: ApiMessageKey.QUEUE_SESSION_JOBS_RETRIEVED_SUCCESS
    });
  }

  @Post('job/:jobId/pause')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Pause job',
    description: 'Pauses a running or queued job' 
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 204, description: 'Job paused successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async pauseJob(@Param('jobId') jobId: string): Promise<void> {
    await this.queueService.pauseJob(jobId);
  }

  @Post('job/:jobId/resume')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Resume job',
    description: 'Resumes a paused job' 
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 204, description: 'Job resumed successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async resumeJob(@Param('jobId') jobId: string): Promise<void> {
    await this.queueService.resumeJob(jobId);
  }

  @Delete('job/:jobId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove job',
    description: 'Permanently removes a job from the queue' 
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 204, description: 'Job removed successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async removeJob(@Param('jobId') jobId: string): Promise<void> {
    await this.queueService.removeJob(jobId);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get queue statistics',
    description: 'Retrieves statistics for all job queues including counts by status' 
  })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  async getQueueStats(): Promise<any> {
    const stats = await this.queueService.getQueueStats();
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: stats,
      message: ApiMessageKey.QUEUE_STATS_RETRIEVED_SUCCESS
    });
  }
}