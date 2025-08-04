import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PluginService, PluginExecutionContext } from './plugin.service';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';

@ApiTags('Plugins')
@Controller('plugins')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Get()
  @ApiOperation({
    summary: 'Get installed plugins',
    description: 'Retrieve list of all installed plugins',
  })
  @ApiQuery({
    name: 'category',
    type: 'string',
    required: false,
    description: 'Filter by plugin category',
  })
  @ApiQuery({
    name: 'enabled',
    type: 'boolean',
    required: false,
    description: 'Filter by enabled status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugins retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              author: { type: 'string' },
              category: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          config: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              settings: { type: 'object' },
            },
          },
          tools: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                inputSchema: { type: 'object' },
                outputSchema: { type: 'object' },
              },
            },
          },
        },
      },
    },
  })
  async getInstalledPlugins(
    @Query('category') category?: string,
    @Query('enabled') enabled?: boolean,
  ) {
    let plugins = await this.pluginService.getInstalledPlugins();
    
    if (category) {
      plugins = plugins.filter(plugin => plugin.metadata.category === category);
    }
    
    if (enabled !== undefined) {
      plugins = plugins.filter(plugin => plugin.config.enabled === enabled);
    }
    
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: plugins,
      message: ApiMessageKey.PLUGIN_RETRIEVED_SUCCESS
    });
  }

  @Get(':pluginId')
  @ApiOperation({
    summary: 'Get plugin details',
    description: 'Retrieve detailed information about a specific plugin',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plugin not found',
  })
  async getPlugin(@Param('pluginId') pluginId: string) {
    const plugin = await this.pluginService.getPlugin(pluginId);
    if (!plugin) {
      return new ApiResponseDto({
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
        message: ApiMessageKey.PLUGIN_NOT_FOUND
      });
    }
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: plugin,
      message: ApiMessageKey.PLUGIN_RETRIEVED_SUCCESS
    });
  }

  @Get(':pluginId/tools')
  @ApiOperation({
    summary: 'Get plugin tools',
    description: 'Retrieve all tools provided by a specific plugin',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin tools retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          method: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  async getPluginTools(@Param('pluginId') pluginId: string) {
    const tools = await this.pluginService.getPluginTools(pluginId);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: tools,
      message: ApiMessageKey.PLUGIN_TOOLS_RETRIEVED_SUCCESS
    });
  }

  @Post(':pluginId/tools/:toolId/execute')
  @ApiOperation({
    summary: 'Execute plugin tool',
    description: 'Execute a specific tool from a plugin',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiParam({
    name: 'toolId',
    type: 'string',
    description: 'Tool ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        input: {
          type: 'object',
          description: 'Input data for the tool',
        },
        sessionId: {
          type: 'string',
          description: 'Optional session ID',
        },
      },
      required: ['input'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tool executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            executionTime: { type: 'number' },
            resourceUsage: { type: 'object' },
          },
        },
      },
    },
  })
  async executePluginTool(
    @Param('pluginId') pluginId: string,
    @Param('toolId') toolId: string,
    @Body('input') input: any,
    @Body('sessionId') sessionId: string,
    @GetUser() user: User,
  ) {
    const context: PluginExecutionContext = {
      userId: user.id,
      sessionId,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      permissions: ['*'], // In a real implementation, get from user permissions
    };

    const result = await this.pluginService.executePluginTool(pluginId, toolId, input, context);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: result,
      message: ApiMessageKey.PLUGIN_TOOL_EXECUTED_SUCCESS
    });
  }

  @Post('install')
  @UseInterceptors(FileInterceptor('plugin'))
  @ApiOperation({
    summary: 'Install plugin',
    description: 'Install a new plugin from a package file',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        plugin: {
          type: 'string',
          format: 'binary',
          description: 'Plugin package file',
        },
      },
      required: ['plugin'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Plugin installed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid plugin package',
  })
  async installPlugin(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    try {
      await this.pluginService.installPlugin(file.buffer, user.id);
      return new ApiResponseDto({
        statusCode: HttpStatus.CREATED,
        data: { filename: file.originalname },
        message: ApiMessageKey.PLUGIN_INSTALLED_SUCCESS
      });
    } catch (error) {
      return new ApiResponseDto({
        statusCode: HttpStatus.BAD_REQUEST,
        data: { details: error.message },
        message: ApiMessageKey.PLUGIN_INSTALLATION_FAILED
      });
    }
  }

  @Delete(':pluginId')
  @ApiOperation({
    summary: 'Uninstall plugin',
    description: 'Remove a plugin from the system',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin uninstalled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plugin not found',
  })
  async uninstallPlugin(
    @Param('pluginId') pluginId: string,
    @GetUser() user: User,
  ) {
    try {
      await this.pluginService.uninstallPlugin(pluginId, user.id);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: { pluginId },
        message: ApiMessageKey.PLUGIN_UNINSTALLED_SUCCESS
      });
    } catch (error) {
      return new ApiResponseDto({
        statusCode: HttpStatus.BAD_REQUEST,
        data: { details: error.message },
        message: ApiMessageKey.PLUGIN_UNINSTALLATION_FAILED
      });
    }
  }

  @Put(':pluginId/enable')
  @ApiOperation({
    summary: 'Enable plugin',
    description: 'Enable a disabled plugin',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin enabled successfully',
  })
  async enablePlugin(@Param('pluginId') pluginId: string) {
    try {
      await this.pluginService.enablePlugin(pluginId);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: { pluginId },
        message: ApiMessageKey.PLUGIN_ENABLED_SUCCESS
      });
    } catch (error) {
      return new ApiResponseDto({
        statusCode: HttpStatus.BAD_REQUEST,
        data: { details: error.message },
        message: ApiMessageKey.PLUGIN_ENABLE_FAILED
      });
    }
  }

  @Put(':pluginId/disable')
  @ApiOperation({
    summary: 'Disable plugin',
    description: 'Disable an enabled plugin',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin disabled successfully',
  })
  async disablePlugin(@Param('pluginId') pluginId: string) {
    try {
      await this.pluginService.disablePlugin(pluginId);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: { pluginId },
        message: ApiMessageKey.PLUGIN_DISABLED_SUCCESS
      });
    } catch (error) {
      return new ApiResponseDto({
        statusCode: HttpStatus.BAD_REQUEST,
        data: { details: error.message },
        message: ApiMessageKey.PLUGIN_DISABLE_FAILED
      });
    }
  }

  @Put(':pluginId/config')
  @ApiOperation({
    summary: 'Update plugin configuration',
    description: 'Update the configuration settings for a plugin',
  })
  @ApiParam({
    name: 'pluginId',
    type: 'string',
    description: 'Plugin ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        settings: { type: 'object' },
        apiKeys: { type: 'object' },
        webhooks: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin configuration updated successfully',
  })
  async updatePluginConfig(
    @Param('pluginId') pluginId: string,
    @Body() config: any,
  ) {
    try {
      await this.pluginService.updatePluginConfig(pluginId, config);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: { pluginId },
        message: ApiMessageKey.PLUGIN_CONFIG_UPDATED_SUCCESS
      });
    } catch (error) {
      return new ApiResponseDto({
        statusCode: HttpStatus.BAD_REQUEST,
        data: { details: error.message },
        message: ApiMessageKey.PLUGIN_CONFIG_UPDATE_FAILED
      });
    }
  }

  @Get('categories/list')
  @ApiOperation({
    summary: 'Get plugin categories',
    description: 'Retrieve list of available plugin categories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plugin categories retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          count: { type: 'number' },
        },
      },
    },
  })
  async getPluginCategories() {
    const plugins = await this.pluginService.getInstalledPlugins();
    const categories = [
      {
        id: 'ai-tool',
        name: 'AI Tools',
        description: 'AI-powered analysis and processing tools',
        count: plugins.filter(p => p.metadata.category === 'ai-tool').length,
      },
      {
        id: 'data-processor',
        name: 'Data Processors',
        description: 'Data transformation and conversion utilities',
        count: plugins.filter(p => p.metadata.category === 'data-processor').length,
      },
      {
        id: 'integration',
        name: 'Integrations',
        description: 'Third-party service integrations',
        count: plugins.filter(p => p.metadata.category === 'integration').length,
      },
      {
        id: 'utility',
        name: 'Utilities',
        description: 'General purpose utility tools',
        count: plugins.filter(p => p.metadata.category === 'utility').length,
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'User-created custom tools',
        count: plugins.filter(p => p.metadata.category === 'custom').length,
      },
    ];

    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: categories,
      message: ApiMessageKey.PLUGIN_RETRIEVED_SUCCESS
    });
  }
}