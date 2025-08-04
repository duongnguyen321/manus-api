import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { GenerateService } from './generate.service';
import {
  GenerateRequestDto,
  GenerateTextDto,
  GenerateCodeDto,
  GenerateImageDto,
  GenerationTaskResponseDto,
  GenerationHistoryResponseDto,
} from './dto/generate.dto';
import { GenerationType } from '@prisma/client';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Content Generation')
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  @Public()
  @ApiOperation({ 
    summary: 'Generate content',
    description: 'Generates content of specified type (text, code, or image) using AI' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Generation task created successfully', 
    type: GenerationTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async generateContent(@Body() generateRequestDto: GenerateRequestDto): Promise<GenerationTaskResponseDto> {
    return this.generateService.generateContent(generateRequestDto);
  }

  @Post('text')
  @Public()
  @ApiOperation({ 
    summary: 'Generate text content',
    description: 'Generates text content using AI with customizable parameters' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Text generation task created successfully', 
    type: GenerationTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async generateText(@Body() generateTextDto: GenerateTextDto): Promise<GenerationTaskResponseDto> {
    return this.generateService.generateText(generateTextDto);
  }

  @Post('code')
  @Public()
  @ApiOperation({ 
    summary: 'Generate code',
    description: 'Generates code in specified programming language with custom style preferences' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Code generation task created successfully', 
    type: GenerationTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async generateCode(@Body() generateCodeDto: GenerateCodeDto): Promise<GenerationTaskResponseDto> {
    return this.generateService.generateCode(generateCodeDto);
  }

  @Post('image')
  @Public()
  @ApiOperation({ 
    summary: 'Generate image',
    description: 'Generates images using AI with customizable size and style options' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Image generation task created successfully', 
    type: GenerationTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async generateImage(@Body() generateImageDto: GenerateImageDto): Promise<GenerationTaskResponseDto> {
    return this.generateService.generateImage(generateImageDto);
  }

  @Get('task/:taskId')
  @Public()
  @ApiOperation({ 
    summary: 'Get generation task',
    description: 'Retrieves details and status of a specific generation task' 
  })
  @ApiParam({ name: 'taskId', description: 'Generation task ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Generation task retrieved successfully', 
    type: GenerationTaskResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getGenerationTask(@Param('taskId') taskId: string): Promise<GenerationTaskResponseDto> {
    return this.generateService.getGenerationTask(taskId);
  }

  @Get('history/:sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Get generation history',
    description: 'Retrieves generation task history for a specific session with pagination' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Tasks per page (default: 20)' })
  @ApiQuery({ name: 'type', required: false, enum: GenerationType, description: 'Filter by generation type' })
  @ApiResponse({ 
    status: 200, 
    description: 'Generation history retrieved successfully', 
    type: GenerationHistoryResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getGenerationHistory(
    @Param('sessionId') sessionId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: GenerationType,
  ): Promise<GenerationHistoryResponseDto> {
    return this.generateService.getGenerationHistory(sessionId, page, limit, type);
  }

  @Post('task/:taskId/retry')
  @Public()
  @ApiOperation({ 
    summary: 'Retry generation task',
    description: 'Retries a failed or cancelled generation task' 
  })
  @ApiParam({ name: 'taskId', description: 'Generation task ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Generation task retried successfully', 
    type: GenerationTaskResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Cannot retry task in current state' })
  async retryGenerationTask(@Param('taskId') taskId: string): Promise<GenerationTaskResponseDto> {
    return this.generateService.retryGenerationTask(taskId);
  }

  @Post('task/:taskId/cancel')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Cancel generation task',
    description: 'Cancels a pending or in-progress generation task' 
  })
  @ApiParam({ name: 'taskId', description: 'Generation task ID' })
  @ApiResponse({ status: 204, description: 'Generation task cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed task' })
  async cancelGenerationTask(@Param('taskId') taskId: string): Promise<void> {
    await this.generateService.cancelGenerationTask(taskId);
  }

  @Delete('task/:taskId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete generation task',
    description: 'Permanently deletes a generation task and its results' 
  })
  @ApiParam({ name: 'taskId', description: 'Generation task ID' })
  @ApiResponse({ status: 204, description: 'Generation task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteGenerationTask(@Param('taskId') taskId: string): Promise<void> {
    await this.generateService.deleteGenerationTask(taskId);
  }

  @Get('health')
  @Public()
  @ApiOperation({ 
    summary: 'Generation service health check',
    description: 'Returns the health status of the generation service' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Service uptime in seconds' }
      }
    }
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'generation',
    };
  }
}