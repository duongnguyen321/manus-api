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
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
	ApiBearerAuth,
} from '@nestjs/swagger';
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
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

@ApiTags('File & Code Editing')
@Controller('edit')
export class EditController {
	constructor(private readonly editService: EditService) {}

	@Post()
	@Public()
	@ApiOperation({
		summary: 'Edit content',
		description:
			'Performs file or code editing operations (create, update, delete, refactor, format)',
	})
	@ApiResponse({
		status: 201,
		description: 'Edit task created successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async editContent(
		@Body() editRequestDto: EditRequestDto
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const editTaskResponse = await this.editService.editContent(editRequestDto);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 201,
			data: editTaskResponse,
			message: ApiMessageKey.EDIT_TASK_CREATED_SUCCESS,
		});
	}

	@Post('create')
	@Public()
	@ApiOperation({
		summary: 'Create file',
		description: 'Creates a new file with specified content',
	})
	@ApiResponse({
		status: 201,
		description: 'File creation task created successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async createFile(
		@Body() createFileDto: CreateFileDto
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const createFileResponse = await this.editService.createFile(createFileDto);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 201,
			data: createFileResponse,
			message: ApiMessageKey.EDIT_TASK_CREATED_SUCCESS,
		});
	}

	@Post('update')
	@Public()
	@ApiOperation({
		summary: 'Update file',
		description: 'Updates existing file content based on instructions',
	})
	@ApiResponse({
		status: 201,
		description: 'File update task created successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async updateFile(
		@Body() updateFileDto: UpdateFileDto
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const updateFileResponse = await this.editService.updateFile(updateFileDto);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 201,
			data: updateFileResponse,
			message: ApiMessageKey.EDIT_TASK_CREATED_SUCCESS,
		});
	}

	@Post('delete')
	@Public()
	@ApiOperation({
		summary: 'Delete file',
		description: 'Deletes a file from the target location',
	})
	@ApiResponse({
		status: 201,
		description: 'File deletion task created successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async deleteFile(
		@Body()
		body: {
			sessionId: string;
			filePath: string;
			processInBackground?: boolean;
		}
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const deleteFileResponse = await this.editService.deleteFile(
			body.sessionId,
			body.filePath,
			body.processInBackground
		);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 201,
			data: deleteFileResponse,
			message: ApiMessageKey.EDIT_TASK_CREATED_SUCCESS,
		});
	}

	@Post('refactor')
	@Public()
	@ApiOperation({
		summary: 'Refactor code',
		description: 'Refactors code based on specified instructions and type',
	})
	@ApiResponse({
		status: 201,
		description: 'Code refactoring task created successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async refactorCode(
		@Body() refactorCodeDto: RefactorCodeDto
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const refactorCodeResponse =
			await this.editService.refactorCode(refactorCodeDto);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 201,
			data: refactorCodeResponse,
			message: ApiMessageKey.EDIT_TASK_CREATED_SUCCESS,
		});
	}

	@Post('format')
	@Public()
	@ApiOperation({
		summary: 'Format code',
		description: 'Formats and beautifies code according to style guidelines',
	})
	@ApiResponse({
		status: 201,
		description: 'Code formatting task created successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async formatCode(
		@Body()
		body: {
			sessionId: string;
			target: string;
			originalContent?: string;
			processInBackground?: boolean;
		}
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const formatCodeResponse = await this.editService.formatCode(
			body.sessionId,
			body.target,
			body.originalContent,
			body.processInBackground
		);
		return new ApiResponseDto({
			statusCode: 200,
			data: formatCodeResponse,
			message: ApiMessageKey.EDIT_TASK_CREATED_SUCCESS,
		});
	}

	@Get('task/:taskId')
	@Public()
	@ApiOperation({
		summary: 'Get edit task',
		description: 'Retrieves details and status of a specific edit task',
	})
	@ApiParam({ name: 'taskId', description: 'Edit task ID' })
	@ApiResponse({
		status: 200,
		description: 'Edit task retrieved successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	async getEditTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const editTaskResponse = await this.editService.getEditTask(taskId);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 200,
			data: editTaskResponse,
			message: ApiMessageKey.EDIT_TASK_RETRIEVED_SUCCESS,
		});
	}

	@Get('history/:sessionId')
	@Public()
	@ApiOperation({
		summary: 'Get edit history',
		description:
			'Retrieves edit task history for a specific session with pagination',
	})
	@ApiParam({ name: 'sessionId', description: 'Session ID' })
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Page number (default: 1)',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Tasks per page (default: 20)',
	})
	@ApiQuery({
		name: 'operation',
		required: false,
		enum: EditOperation,
		description: 'Filter by operation type',
	})
	@ApiResponse({
		status: 200,
		description: 'Edit history retrieved successfully',
		type: EditHistoryResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Session not found' })
	async getEditHistory(
		@Param('sessionId') sessionId: string,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 20,
		@Query('operation') operation?: EditOperation
	): Promise<ApiResponseDto<EditHistoryResponseDto>> {
		const editHistoryResponse = await this.editService.getEditHistory(
			sessionId,
			page,
			limit,
			operation
		);
		return new ApiResponseDto<EditHistoryResponseDto>({
			statusCode: 200,
			data: editHistoryResponse,
			message: ApiMessageKey.EDIT_TASK_RETRIEVED_SUCCESS,
		});
	}

	@Post('task/:taskId/retry')
	@Public()
	@ApiOperation({
		summary: 'Retry edit task',
		description: 'Retries a failed or cancelled edit task',
	})
	@ApiParam({ name: 'taskId', description: 'Edit task ID' })
	@ApiResponse({
		status: 200,
		description: 'Edit task retried successfully',
		type: EditTaskResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	@ApiResponse({
		status: 400,
		description: 'Cannot retry task in current state',
	})
	async retryEditTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<EditTaskResponseDto>> {
		const retryEditTaskResponse = await this.editService.retryEditTask(taskId);
		return new ApiResponseDto<EditTaskResponseDto>({
			statusCode: 200,
			data: retryEditTaskResponse,
			message: ApiMessageKey.EDIT_TASK_RETRIEVED_SUCCESS,
		});
	}

	@Post('task/:taskId/cancel')
	@Public()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Cancel edit task',
		description: 'Cancels a pending or in-progress edit task',
	})
	@ApiParam({ name: 'taskId', description: 'Edit task ID' })
	@ApiResponse({ status: 204, description: 'Edit task cancelled successfully' })
	@ApiResponse({ status: 404, description: 'Task not found' })
	@ApiResponse({ status: 400, description: 'Cannot cancel completed task' })
	async cancelEditTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<void>> {
		await this.editService.cancelEditTask(taskId);
		return new ApiResponseDto<void>({
			statusCode: 204,
			data: null,
			message: ApiMessageKey.EDIT_TASK_CANCELLED_SUCCESS,
		});
	}

	@Delete('task/:taskId')
	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Delete edit task',
		description: 'Permanently deletes an edit task and its results',
	})
	@ApiParam({ name: 'taskId', description: 'Edit task ID' })
	@ApiResponse({ status: 204, description: 'Edit task deleted successfully' })
	@ApiResponse({ status: 404, description: 'Task not found' })
	async deleteEditTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<void>> {
		await this.editService.deleteEditTask(taskId);
		return new ApiResponseDto<void>({
			statusCode: 204,
			data: null,
			message: ApiMessageKey.EDIT_TASK_DELETED_SUCCESS,
		});
	}
}
