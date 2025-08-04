import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	InternalServerErrorException,
	BadRequestException,
} from '@nestjs/common';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiBearerAuth,
} from '@nestjs/swagger';
import {
	DockerContainer,
	DockerExecutionResult,
	DockerService,
} from './docker.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

class ExecuteCodeDto {
	@IsEnum(['python', 'nodejs', 'bash'])
	language: 'python' | 'nodejs' | 'bash';

	@IsString()
	code: string;

	@IsOptional()
	@IsString()
	sessionId?: string;
}

class CreateContainerDto {
	@IsEnum(['python', 'nodejs', 'bash'])
	language: 'python' | 'nodejs' | 'bash';

	@IsString()
	sessionId: string;
}

class ExecuteInContainerDto {
	@IsString()
	command: string;
}

@ApiTags('Docker Control')
@Controller('docker')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DockerController {
	constructor(private readonly dockerService: DockerService) {}

	@Post('execute')
	@ApiOperation({
		summary: 'Execute code in temporary Docker container',
		description: 'Run code in isolated Docker container with automatic cleanup',
	})
	@ApiBody({ type: ExecuteCodeDto })
	@ApiResponse({
		status: 200,
		description: 'Code execution result',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				output: { type: 'string' },
				error: { type: 'string' },
				containerId: { type: 'string' },
				executionTime: { type: 'number' },
			},
		},
	})
	async executeCode(@Body() executeDto: ExecuteCodeDto) {
		const result = await this.dockerService.executeCode(
			executeDto.language,
			executeDto.code,
			executeDto.sessionId
		);
		return new ApiResponseDto<DockerExecutionResult>({
			statusCode: 200,
			data: result,
			message: ApiMessageKey.DOCKER_EXECUTE_CODE_SUCCESS,
		});
	}

	@Post('containers')
	@ApiOperation({
		summary: 'Create persistent Docker container',
		description: 'Create a long-running container for interactive sessions',
	})
	@ApiBody({ type: CreateContainerDto })
	@ApiResponse({
		status: 200,
		description: 'Container created successfully',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean' },
				containerId: { type: 'string' },
				message: { type: 'string' },
			},
		},
	})
	async createContainer(@Body() createDto: CreateContainerDto) {
		try {
			const containerId = await this.dockerService.createPersistentContainer(
				createDto.language,
				createDto.sessionId
			);

			return new ApiResponseDto<string>({
				statusCode: 200,
				data: {
					success: true,
					containerId,
					message: `Created persistent ${createDto.language} container`,
				},
				message: ApiMessageKey.DOCKER_CREATE_CONTAINER_SUCCESS,
			});
		} catch (error) {
			throw new InternalServerErrorException(error.message);
		}
	}

	@Post('containers/:containerId/execute')
	@ApiOperation({
		summary: 'Execute command in existing container',
		description: 'Run command in persistent container',
	})
	@ApiBody({ type: ExecuteInContainerDto })
	@ApiResponse({
		status: 200,
		description: 'Command execution result',
	})
	async executeInContainer(
		@Param('containerId') containerId: string,
		@Body() executeDto: ExecuteInContainerDto
	) {
		const result = await this.dockerService.executeInContainer(
			containerId,
			executeDto.command
		);
		return new ApiResponseDto<DockerExecutionResult>({
			statusCode: 200,
			data: result,
			message: ApiMessageKey.DOCKER_EXECUTE_CODE_SUCCESS,
		});
	}

	@Get('containers')
	@ApiOperation({
		summary: 'List Docker containers',
		description: 'Get list of containers, optionally filtered by session',
	})
	@ApiResponse({
		status: 200,
		description: 'List of containers',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					image: { type: 'string' },
					status: { type: 'string' },
					created: { type: 'string', format: 'date-time' },
					sessionId: { type: 'string' },
				},
			},
		},
	})
	async listContainers(@Query('sessionId') sessionId?: string) {
		const containers = await this.dockerService.listContainers(sessionId);
		return new ApiResponseDto<DockerContainer[]>({
			statusCode: 200,
			data: containers,
			message: ApiMessageKey.DOCKER_LIST_CONTAINERS_SUCCESS,
		});
	}

	@Delete('containers/:containerId')
	@ApiOperation({
		summary: 'Stop and remove container',
		description: 'Stop and remove specified container',
	})
	@ApiResponse({
		status: 200,
		description: 'Container stopped successfully',
	})
	async stopContainer(@Param('containerId') containerId: string) {
		const success = await this.dockerService.stopContainer(containerId);
		if (!success) {
			throw new BadRequestException(
				'Failed to stop container. Please try again.'
			);
		}
		return new ApiResponseDto<boolean>({
			statusCode: 200,
			data: success,
			message: ApiMessageKey.DOCKER_STOP_CONTAINER_SUCCESS,
		});
	}

	@Delete('sessions/:sessionId/containers')
	@ApiOperation({
		summary: 'Cleanup session containers',
		description: 'Stop and remove all containers for a session',
	})
	@ApiResponse({
		status: 200,
		description: 'Session containers cleaned up',
	})
	async cleanupSession(@Param('sessionId') sessionId: string) {
		const cleaned =
			await this.dockerService.cleanupSessionContainers(sessionId);
		return new ApiResponseDto<number>({
			statusCode: 200,
			data: cleaned,
			message: ApiMessageKey.DOCKER_CLEANUP_SESSION_SUCCESS,
		});
	}

	@Get('containers/:containerId/logs')
	@ApiOperation({
		summary: 'Get container logs',
		description: 'Retrieve logs from specified container',
	})
	@ApiResponse({
		status: 200,
		description: 'Container logs',
		schema: {
			type: 'object',
			properties: {
				containerId: { type: 'string' },
				logs: { type: 'string' },
			},
		},
	})
	async getContainerLogs(@Param('containerId') containerId: string) {
		const logs = await this.dockerService.getContainerLogs(containerId);
		return new ApiResponseDto<string>({
			statusCode: 200,
			data: logs,
			message: ApiMessageKey.DOCKER_GET_CONTAINER_LOGS_SUCCESS,
		});
	}
}
