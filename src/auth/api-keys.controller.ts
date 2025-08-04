import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from './guards/Auth.guard';
import { ApiKeysService } from './api-keys.service';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';
import {
  CreateApiKeyDto,
  UpdateApiKeyDto,
  ApiKeyResponseDto,
  ApiKeyUsageDto,
} from './dto/api-keys.dto';
import { RequirePermissions, RateLimit } from './decorators/enhanced-auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('API Keys')
@Controller('auth/api-keys')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequirePermissions('api_keys:create')
  @RateLimit(5, 3600) // 5 API key creations per hour
  @ApiOperation({
    summary: 'Create a new API key',
    description: 'Generate a new API key with specified permissions and limits',
  })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
  })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto, @GetUser() user: User) {
    try {
      const apiKey = await this.apiKeysService.createApiKey({
        ...createApiKeyDto,
        userId: user.id,
      });
      return new ApiResponseDto({
        statusCode: HttpStatus.CREATED,
        data: apiKey,
        message: ApiMessageKey.API_KEY_CREATED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Get()
  @RequirePermissions('api_keys:read')
  @ApiOperation({
    summary: 'List user API keys',
    description: 'Get all API keys for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
    type: [ApiKeyResponseDto],
  })
  async listApiKeys(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetUser() user: User,
  ) {
    try {
      const result = await this.apiKeysService.listApiKeys({
        userId: user.id,
        page: Number(page),
        limit: Number(limit),
      });
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result.apiKeys,
        message: ApiMessageKey.API_KEYS_RETRIEVED_SUCCESS,
        pagination: result.pagination,
      });
    } catch (err) {
      throw err;
    }
  }

  @Get(':keyId')
  @RequirePermissions('api_keys:read')
  @ApiOperation({
    summary: 'Get API key details',
    description: 'Get detailed information about a specific API key',
  })
  @ApiResponse({
    status: 200,
    description: 'API key details retrieved successfully',
    type: ApiKeyResponseDto,
  })
  async getApiKey(@Param('keyId') keyId: string, @GetUser() user: User) {
    try {
      const apiKey = await this.apiKeysService.getApiKey(keyId, user.id);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: apiKey,
        message: ApiMessageKey.API_KEY_DETAILS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Put(':keyId')
  @RequirePermissions('api_keys:update')
  @ApiOperation({
    summary: 'Update API key',
    description: 'Update API key permissions, limits, and status',
  })
  @ApiBody({ type: UpdateApiKeyDto })
  @ApiResponse({
    status: 200,
    description: 'API key updated successfully',
    type: ApiKeyResponseDto,
  })
  async updateApiKey(
    @Param('keyId') keyId: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
    @GetUser() user: User,
  ) {
    try {
      const apiKey = await this.apiKeysService.updateApiKey(keyId, {
        ...updateApiKeyDto,
        userId: user.id,
      });
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: apiKey,
        message: ApiMessageKey.API_KEY_UPDATED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Delete(':keyId')
  @RequirePermissions('api_keys:delete')
  @ApiOperation({
    summary: 'Delete API key',
    description: 'Permanently delete an API key',
  })
  @ApiResponse({
    status: 200,
    description: 'API key deleted successfully',
  })
  async deleteApiKey(@Param('keyId') keyId: string, @GetUser() user: User) {
    try {
      await this.apiKeysService.deleteApiKey(keyId, user.id);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: { deleted: true },
        message: ApiMessageKey.API_KEY_DELETED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Post(':keyId/regenerate')
  @RequirePermissions('api_keys:update')
  @RateLimit(3, 3600) // 3 regenerations per hour
  @ApiOperation({
    summary: 'Regenerate API key',
    description: 'Generate a new key value for an existing API key',
  })
  @ApiResponse({
    status: 200,
    description: 'API key regenerated successfully',
    type: ApiKeyResponseDto,
  })
  async regenerateApiKey(@Param('keyId') keyId: string, @GetUser() user: User) {
    try {
      const apiKey = await this.apiKeysService.regenerateApiKey(keyId, user.id);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: apiKey,
        message: ApiMessageKey.API_KEY_REGENERATED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Get(':keyId/usage')
  @RequirePermissions('api_keys:read')
  @ApiOperation({
    summary: 'Get API key usage statistics',
    description: 'Get detailed usage statistics for an API key',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully',
    type: ApiKeyUsageDto,
  })
  async getApiKeyUsage(
    @Param('keyId') keyId: string,
    @Query('days') days: number = 30,
  ) {
    try {
      const usage = await this.apiKeysService.getApiKeyUsage(keyId, Number(days));
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: usage,
        message: ApiMessageKey.USAGE_STATISTICS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Post(':keyId/rotate')
  @RequirePermissions('api_keys:update')
  @RateLimit(1, 86400) // 1 rotation per day
  @ApiOperation({
    summary: 'Rotate API key',
    description: 'Create a new API key and schedule the old one for deletion',
  })
  @ApiResponse({
    status: 200,
    description: 'API key rotated successfully',
    type: ApiKeyResponseDto,
  })
  async rotateApiKey(@Param('keyId') keyId: string, @GetUser() user: User) {
    try {
      const result = await this.apiKeysService.rotateApiKey(keyId, user.id);
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: result,
        message: ApiMessageKey.API_KEY_ROTATED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }
}