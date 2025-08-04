import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DockerService } from './docker.service';
import { AuthGuard } from '../auth/guards/Auth.guard';

class ExecuteCodeDto {
  language: 'python' | 'nodejs' | 'bash';
  code: string;
  sessionId?: string;
}

class CreateContainerDto {
  language: 'python' | 'nodejs' | 'bash';
  sessionId: string;
}

class ExecuteInContainerDto {
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
    description: 'Run code in isolated Docker container with automatic cleanup'
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
        executionTime: { type: 'number' }
      }
    }
  })
  async executeCode(@Body() executeDto: ExecuteCodeDto) {
    return this.dockerService.executeCode(
      executeDto.language,
      executeDto.code,
      executeDto.sessionId,
    );
  }

  @Post('containers')
  @ApiOperation({ 
    summary: 'Create persistent Docker container',
    description: 'Create a long-running container for interactive sessions'
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
        message: { type: 'string' }
      }
    }
  })
  async createContainer(@Body() createDto: CreateContainerDto) {
    try {
      const containerId = await this.dockerService.createPersistentContainer(
        createDto.language,
        createDto.sessionId,
      );

      return {
        success: true,
        containerId,
        message: `Created persistent ${createDto.language} container`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('containers/:containerId/execute')
  @ApiOperation({ 
    summary: 'Execute command in existing container',
    description: 'Run command in persistent container'
  })
  @ApiBody({ type: ExecuteInContainerDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Command execution result'
  })
  async executeInContainer(
    @Param('containerId') containerId: string,
    @Body() executeDto: ExecuteInContainerDto,
  ) {
    return this.dockerService.executeInContainer(
      containerId,
      executeDto.command,
    );
  }

  @Get('containers')
  @ApiOperation({ 
    summary: 'List Docker containers',
    description: 'Get list of containers, optionally filtered by session'
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
          sessionId: { type: 'string' }
        }
      }
    }
  })
  async listContainers(@Query('sessionId') sessionId?: string) {
    return this.dockerService.listContainers(sessionId);
  }

  @Delete('containers/:containerId')
  @ApiOperation({ 
    summary: 'Stop and remove container',
    description: 'Stop and remove specified container'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Container stopped successfully'
  })
  async stopContainer(@Param('containerId') containerId: string) {
    const success = await this.dockerService.stopContainer(containerId);
    return {
      success,
      message: success 
        ? 'Container stopped successfully' 
        : 'Failed to stop container',
    };
  }

  @Delete('sessions/:sessionId/containers')
  @ApiOperation({ 
    summary: 'Cleanup session containers',
    description: 'Stop and remove all containers for a session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session containers cleaned up'
  })
  async cleanupSession(@Param('sessionId') sessionId: string) {
    const cleaned = await this.dockerService.cleanupSessionContainers(sessionId);
    return {
      success: true,
      cleaned,
      message: `Cleaned up ${cleaned} containers for session ${sessionId}`,
    };
  }

  @Get('containers/:containerId/logs')
  @ApiOperation({ 
    summary: 'Get container logs',
    description: 'Retrieve logs from specified container'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Container logs',
    schema: {
      type: 'object',
      properties: {
        containerId: { type: 'string' },
        logs: { type: 'string' }
      }
    }
  })
  async getContainerLogs(@Param('containerId') containerId: string) {
    const logs = await this.dockerService.getContainerLogs(containerId);
    return {
      containerId,
      logs,
    };
  }
}