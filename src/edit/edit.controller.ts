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
import { EditService } from './edit.service';
import {
  EditRequestDto,
  CreateFileDto,
  UpdateFileDto,
  RefactorCodeDto,
  EditTaskResponseDto,
  EditHistoryResponseDto,
} from './dto/edit.dto';
import { EditOperation } from '@prisma/client';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('File & Code Editing')
@Controller('edit')
export class EditController {
  constructor(private readonly editService: EditService) {}

  @Post()
  @Public()
  @ApiOperation({ 
    summary: 'Edit content',
    description: 'Performs file or code editing operations (create, update, delete, refactor, format)' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Edit task created successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async editContent(@Body() editRequestDto: EditRequestDto): Promise<EditTaskResponseDto> {
    return this.editService.editContent(editRequestDto);
  }

  @Post('create')
  @Public()
  @ApiOperation({ 
    summary: 'Create file',
    description: 'Creates a new file with specified content' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File creation task created successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async createFile(@Body() createFileDto: CreateFileDto): Promise<EditTaskResponseDto> {
    return this.editService.createFile(createFileDto);
  }

  @Post('update')
  @Public()
  @ApiOperation({ 
    summary: 'Update file',
    description: 'Updates existing file content based on instructions' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File update task created successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateFile(@Body() updateFileDto: UpdateFileDto): Promise<EditTaskResponseDto> {
    return this.editService.updateFile(updateFileDto);
  }

  @Post('delete')
  @Public()
  @ApiOperation({ 
    summary: 'Delete file',
    description: 'Deletes a file from the target location' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File deletion task created successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteFile(
    @Body() body: { sessionId: string; filePath: string; processInBackground?: boolean }
  ): Promise<EditTaskResponseDto> {
    return this.editService.deleteFile(body.sessionId, body.filePath, body.processInBackground);
  }

  @Post('refactor')
  @Public()
  @ApiOperation({ 
    summary: 'Refactor code',
    description: 'Refactors code based on specified instructions and type' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Code refactoring task created successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async refactorCode(@Body() refactorCodeDto: RefactorCodeDto): Promise<EditTaskResponseDto> {
    return this.editService.refactorCode(refactorCodeDto);
  }

  @Post('format')
  @Public()
  @ApiOperation({ 
    summary: 'Format code',
    description: 'Formats and beautifies code according to style guidelines' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Code formatting task created successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async formatCode(
    @Body() body: { sessionId: string; target: string; originalContent?: string; processInBackground?: boolean }
  ): Promise<EditTaskResponseDto> {
    return this.editService.formatCode(body.sessionId, body.target, body.originalContent, body.processInBackground);
  }

  @Get('task/:taskId')
  @Public()
  @ApiOperation({ 
    summary: 'Get edit task',
    description: 'Retrieves details and status of a specific edit task' 
  })
  @ApiParam({ name: 'taskId', description: 'Edit task ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Edit task retrieved successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getEditTask(@Param('taskId') taskId: string): Promise<EditTaskResponseDto> {
    return this.editService.getEditTask(taskId);
  }

  @Get('history/:sessionId')
  @Public()
  @ApiOperation({ 
    summary: 'Get edit history',
    description: 'Retrieves edit task history for a specific session with pagination' 
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Tasks per page (default: 20)' })
  @ApiQuery({ name: 'operation', required: false, enum: EditOperation, description: 'Filter by operation type' })
  @ApiResponse({ 
    status: 200, 
    description: 'Edit history retrieved successfully', 
    type: EditHistoryResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getEditHistory(
    @Param('sessionId') sessionId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('operation') operation?: EditOperation,
  ): Promise<EditHistoryResponseDto> {
    return this.editService.getEditHistory(sessionId, page, limit, operation);
  }

  @Post('task/:taskId/retry')
  @Public()
  @ApiOperation({ 
    summary: 'Retry edit task',
    description: 'Retries a failed or cancelled edit task' 
  })
  @ApiParam({ name: 'taskId', description: 'Edit task ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Edit task retried successfully', 
    type: EditTaskResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Cannot retry task in current state' })
  async retryEditTask(@Param('taskId') taskId: string): Promise<EditTaskResponseDto> {
    return this.editService.retryEditTask(taskId);
  }

  @Post('task/:taskId/cancel')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Cancel edit task',
    description: 'Cancels a pending or in-progress edit task' 
  })
  @ApiParam({ name: 'taskId', description: 'Edit task ID' })
  @ApiResponse({ status: 204, description: 'Edit task cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed task' })
  async cancelEditTask(@Param('taskId') taskId: string): Promise<void> {
    await this.editService.cancelEditTask(taskId);
  }

  @Delete('task/:taskId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete edit task',
    description: 'Permanently deletes an edit task and its results' 
  })
  @ApiParam({ name: 'taskId', description: 'Edit task ID' })
  @ApiResponse({ status: 204, description: 'Edit task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteEditTask(@Param('taskId') taskId: string): Promise<void> {
    await this.editService.deleteEditTask(taskId);
  }

  @Get('health')
  @Public()
  @ApiOperation({ 
    summary: 'Edit service health check',
    description: 'Returns the health status of the edit service' 
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
      service: 'edit',
    };
  }
}