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
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

@ApiTags('Content Generation')
@Controller('generate')
export class GenerateController {
	constructor(private readonly generateService: GenerateService) {}

	@Post()
	@Public()
	@ApiOperation({
		summary: 'Generate content',
		description:
			'Generates content of specified type (text, code, or image) using AI',
	})
	@ApiResponse({
		status: 201,
		description: 'Generation task created successfully',
		type: GenerationTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async generateContent(
		@Body() generateRequestDto: GenerateRequestDto
	): Promise<ApiResponseDto<GenerationTaskResponseDto>> {
		const generatedResponse =
			await this.generateService.generateContent(generateRequestDto);
		return new ApiResponseDto<GenerationTaskResponseDto>({
			statusCode: 201,
			data: generatedResponse,
			message: ApiMessageKey.GENERATION_TASK_CREATED_SUCCESS,
		});
	}

	@Post('text')
	@Public()
	@ApiOperation({
		summary: 'Generate text content',
		description: 'Generates text content using AI with customizable parameters',
	})
	@ApiResponse({
		status: 201,
		description: 'Text generation task created successfully',
		type: GenerationTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async generateText(
		@Body() generateTextDto: GenerateTextDto
	): Promise<ApiResponseDto<GenerationTaskResponseDto>> {
		const generatedTextResponse =
			await this.generateService.generateText(generateTextDto);
		return new ApiResponseDto<GenerationTaskResponseDto>({
			statusCode: 201,
			data: generatedTextResponse,
			message: ApiMessageKey.GENERATION_TASK_CREATED_SUCCESS,
		});
	}

	@Post('code')
	@Public()
	@ApiOperation({
		summary: 'Generate code',
		description:
			'Generates code in specified programming language with custom style preferences',
	})
	@ApiResponse({
		status: 201,
		description: 'Code generation task created successfully',
		type: GenerationTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async generateCode(
		@Body() generateCodeDto: GenerateCodeDto
	): Promise<ApiResponseDto<GenerationTaskResponseDto>> {
		const generatedCodeResponse =
			await this.generateService.generateCode(generateCodeDto);
		return new ApiResponseDto<GenerationTaskResponseDto>({
			statusCode: 201,
			data: generatedCodeResponse,
			message: ApiMessageKey.GENERATION_TASK_CREATED_SUCCESS,
		});
	}

	@Post('image')
	@Public()
	@ApiOperation({
		summary: 'Generate image',
		description:
			'Generates images using AI with customizable size and style options',
	})
	@ApiResponse({
		status: 201,
		description: 'Image generation task created successfully',
		type: GenerationTaskResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async generateImage(
		@Body() generateImageDto: GenerateImageDto
	): Promise<ApiResponseDto<GenerationTaskResponseDto>> {
		const generatedImageResponse =
			await this.generateService.generateImage(generateImageDto);
		return new ApiResponseDto<GenerationTaskResponseDto>({
			statusCode: 201,
			data: generatedImageResponse,
			message: ApiMessageKey.GENERATION_TASK_CREATED_SUCCESS,
		});
	}

	@Get('task/:taskId')
	@Public()
	@ApiOperation({
		summary: 'Get generation task',
		description: 'Retrieves details and status of a specific generation task',
	})
	@ApiParam({ name: 'taskId', description: 'Generation task ID' })
	@ApiResponse({
		status: 200,
		description: 'Generation task retrieved successfully',
		type: GenerationTaskResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	async getGenerationTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<GenerationTaskResponseDto>> {
		const generationTaskResponse =
			await this.generateService.getGenerationTask(taskId);
		return new ApiResponseDto<GenerationTaskResponseDto>({
			statusCode: 200,
			data: generationTaskResponse,
			message: ApiMessageKey.GENERATION_TASK_RETRIEVED_SUCCESS,
		});
	}

	@Get('history/:sessionId')
	@Public()
	@ApiOperation({
		summary: 'Get generation history',
		description:
			'Retrieves generation task history for a specific session with pagination',
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
		name: 'type',
		required: false,
		enum: GenerationType,
		description: 'Filter by generation type',
	})
	@ApiResponse({
		status: 200,
		description: 'Generation history retrieved successfully',
		type: GenerationHistoryResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Session not found' })
	async getGenerationHistory(
		@Param('sessionId') sessionId: string,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 20,
		@Query('type') type?: GenerationType
	): Promise<ApiResponseDto<GenerationHistoryResponseDto>> {
		const generationHistoryResponse =
			await this.generateService.getGenerationHistory(
				sessionId,
				page,
				limit,
				type
			);
		return new ApiResponseDto<GenerationHistoryResponseDto>({
			statusCode: 200,
			data: generationHistoryResponse,
			message: ApiMessageKey.GENERATION_TASK_RETRIEVED_SUCCESS,
		});
	}

	@Post('task/:taskId/retry')
	@Public()
	@ApiOperation({
		summary: 'Retry generation task',
		description: 'Retries a failed or cancelled generation task',
	})
	@ApiParam({ name: 'taskId', description: 'Generation task ID' })
	@ApiResponse({
		status: 200,
		description: 'Generation task retried successfully',
		type: GenerationTaskResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	@ApiResponse({
		status: 400,
		description: 'Cannot retry task in current state',
	})
	async retryGenerationTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<GenerationTaskResponseDto>> {
		const retryGenerationTaskResponse =
			await this.generateService.retryGenerationTask(taskId);
		return new ApiResponseDto<GenerationTaskResponseDto>({
			statusCode: 200,
			data: retryGenerationTaskResponse,
			message: ApiMessageKey.GENERATION_TASK_RETRIEVED_SUCCESS,
		});
	}

	@Post('task/:taskId/cancel')
	@Public()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Cancel generation task',
		description: 'Cancels a pending or in-progress generation task',
	})
	@ApiParam({ name: 'taskId', description: 'Generation task ID' })
	@ApiResponse({
		status: 204,
		description: 'Generation task cancelled successfully',
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	@ApiResponse({ status: 400, description: 'Cannot cancel completed task' })
	async cancelGenerationTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<void>> {
		await this.generateService.cancelGenerationTask(taskId);
		return new ApiResponseDto<void>({
			statusCode: 204,
			data: null,
			message: ApiMessageKey.GENERATION_TASK_CANCELLED_SUCCESS,
		});
	}

	@Delete('task/:taskId')
	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Delete generation task',
		description: 'Permanently deletes a generation task and its results',
	})
	@ApiParam({ name: 'taskId', description: 'Generation task ID' })
	@ApiResponse({
		status: 204,
		description: 'Generation task deleted successfully',
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	async deleteGenerationTask(
		@Param('taskId') taskId: string
	): Promise<ApiResponseDto<void>> {
		await this.generateService.deleteGenerationTask(taskId);
		return new ApiResponseDto<void>({
			statusCode: 204,
			data: null,
			message: ApiMessageKey.GENERATION_TASK_DELETED_SUCCESS,
		});
	}
}
