import {
	Controller,
	Post,
	Get,
	Delete,
	Param,
	Body,
	UploadedFile,
	UseInterceptors,
	Query,
	ParseUUIDPipe,
	HttpStatus,
	UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiConsumes,
	ApiBody,
	ApiQuery,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger';
import { FilesService, FileUploadResult } from './files.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiMessageKey } from '@/common/constants/message.constants';
import { ApiResponseDto } from '@/common/classes/response.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class FilesController {
	constructor(private readonly filesService: FilesService) {}

	@Post('upload')
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({
		summary: 'Upload a file',
		description: 'Upload a file with optional processing options',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
					description: 'File to upload',
				},
				generateThumbnail: {
					type: 'boolean',
					description: 'Generate thumbnail for images',
					default: true,
				},
				extractText: {
					type: 'boolean',
					description: 'Extract text from documents',
					default: true,
				},
				aiAnalysis: {
					type: 'boolean',
					description: 'Perform AI analysis on content',
					default: false,
				},
				compress: {
					type: 'boolean',
					description: 'Compress file if applicable',
					default: false,
				},
			},
			required: ['file'],
		},
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'File uploaded successfully',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string', format: 'uuid' },
				filename: { type: 'string' },
				originalName: { type: 'string' },
				mimeType: { type: 'string' },
				size: { type: 'number' },
				url: { type: 'string' },
				thumbnailUrl: { type: 'string', nullable: true },
				extractedText: { type: 'string', nullable: true },
				aiAnalysis: { type: 'object', nullable: true },
				metadata: { type: 'object' },
				uploadedAt: { type: 'string', format: 'date-time' },
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid file or processing options',
	})
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@GetUser() user: User,
		@Body('generateThumbnail') generateThumbnail: boolean = true,
		@Body('extractText') extractText: boolean = true,
		@Body('aiAnalysis') aiAnalysis: boolean = false,
		@Body('compress') compress: boolean = false
	) {
		const uploadFileResponse = await this.filesService.uploadFile(
			file,
			user.id,
			{
				generateThumbnail,
				extractText,
				aiAnalysis,
				compress,
			}
		);
		return new ApiResponseDto<FileUploadResult>({
			statusCode: 201,
			data: uploadFileResponse,
			message: ApiMessageKey.FILE_UPLOADED_SUCCESS,
		});
	}

	@Get()
	@ApiOperation({
		summary: 'List user files',
		description: 'Get paginated list of files uploaded by the current user',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
		description: 'Page number (default: 1)',
	})
	@ApiQuery({
		name: 'limit',
		type: 'number',
		required: false,
		description: 'Items per page (default: 20, max: 100)',
	})
	@ApiQuery({
		name: 'mimeType',
		type: 'string',
		required: false,
		description: 'Filter by MIME type',
	})
	@ApiQuery({
		name: 'search',
		type: 'string',
		required: false,
		description: 'Search in filename or extracted text',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Files retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				files: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string', format: 'uuid' },
							filename: { type: 'string' },
							originalName: { type: 'string' },
							mimeType: { type: 'string' },
							size: { type: 'number' },
							url: { type: 'string' },
							uploadedAt: { type: 'string', format: 'date-time' },
						},
					},
				},
				pagination: {
					type: 'object',
					properties: {
						page: { type: 'number' },
						limit: { type: 'number' },
						total: { type: 'number' },
						totalPages: { type: 'number' },
					},
				},
			},
		},
	})
	async getUserFiles(
		@GetUser() user: User,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 20,
		@Query('mimeType') mimeType?: string,
		@Query('search') search?: string
	) {
		const userFilesResponse = await this.filesService.getUserFiles(user.id, {
			page: Math.max(1, page),
			limit: Math.min(100, Math.max(1, limit)),
			mimeType,
			search,
		});
		return new ApiResponseDto({
			statusCode: 200,
			data: userFilesResponse,
			message: ApiMessageKey.GET_USER_FILES_SUCCESS,
			pagination: {
				limit,
				page,
				total: 100,
			},
		});
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get file details',
		description: 'Get detailed information about a specific file',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		format: 'uuid',
		description: 'File ID',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'File details retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string', format: 'uuid' },
				filename: { type: 'string' },
				originalName: { type: 'string' },
				mimeType: { type: 'string' },
				size: { type: 'number' },
				url: { type: 'string' },
				thumbnailUrl: { type: 'string', nullable: true },
				extractedText: { type: 'string', nullable: true },
				aiAnalysis: { type: 'object', nullable: true },
				metadata: { type: 'object' },
				uploadedAt: { type: 'string', format: 'date-time' },
				uploadedBy: { type: 'string', format: 'uuid' },
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'File not found',
	})
	async getFile(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
		const getFileResponse = await this.filesService.getFile(id, user.id);
		return new ApiResponseDto<FileUploadResult | null>({
			statusCode: 200,
			data: getFileResponse,
			message: ApiMessageKey.GET_FILE_SUCCESS,
		});
	}

	@Post(':id/analyze')
	@ApiOperation({
		summary: 'Analyze file with AI',
		description: 'Perform AI analysis on an uploaded file',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		format: 'uuid',
		description: 'File ID',
	})
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				customPrompt: {
					type: 'string',
					description: 'Custom analysis prompt',
				},
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'File analyzed successfully',
		schema: {
			type: 'object',
			properties: {
				analysis: { type: 'object' },
				updatedAt: { type: 'string', format: 'date-time' },
			},
		},
	})
	async analyzeFile(
		@Param('id', ParseUUIDPipe) id: string,
		@GetUser() user: User,
		@Body('customPrompt') customPrompt?: string
	) {
		const analyzeFileResponse = await this.filesService.analyzeFile(
			id,
			user.id,
			customPrompt
		);
		return new ApiResponseDto<{
			analysis: {
				response: string;
				customPrompt: string;
				analyzedAt: string;
				textLength: number;
			};
			updatedAt: Date;
		}>({
			statusCode: 200,
			data: analyzeFileResponse,
			message: ApiMessageKey.FILE_ANALYZED_SUCCESS,
		});
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Delete file',
		description: 'Delete a file and all associated data',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		format: 'uuid',
		description: 'File ID',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'File deleted successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				deletedFileId: { type: 'string', format: 'uuid' },
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'File not found',
	})
	async deleteFile(
		@Param('id', ParseUUIDPipe) id: string,
		@GetUser() user: User
	) {
		const isDeleted = await this.filesService.deleteFile(id, user.id);
		return new ApiResponseDto<boolean>({
			statusCode: 200,
			data: isDeleted,
			message: ApiMessageKey.FILE_DELETED_SUCCESS,
		});
	}

	@Get('stats/storage')
	@ApiOperation({
		summary: 'Get storage statistics',
		description: 'Get storage usage statistics for the current user',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Storage statistics retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				totalFiles: { type: 'number' },
				totalSize: { type: 'number' },
				sizeByType: { type: 'object' },
				quotaUsed: { type: 'number' },
				quotaLimit: { type: 'number' },
				quotaPercentage: { type: 'number' },
			},
		},
	})
	async getStorageStats(@GetUser() user: User) {
		const storageStatsResponse = await this.filesService.getStorageStats(
			user.id
		);
		return new ApiResponseDto({
			statusCode: 200,
			data: storageStatsResponse,
			message: ApiMessageKey.GET_STORAGE_STATS_SUCCESS,
		});
	}
}
