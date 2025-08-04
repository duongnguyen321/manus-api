import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { MultiProviderAIService, AIProvider } from './multi-provider.service';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { ApiMessageKey } from '@/common/constants/message.constants';
import { 
  RequirePermissions, 
  CanExecuteTools, 
  StandardRateLimit 
} from '../auth/decorators/enhanced-auth.decorator';
import {
  MultiProviderChatDto,
  MultiProviderGenerateDto,
  AIProviderStatusDto,
  ProviderCapabilitiesDto,
  ProviderStatsDto,
} from './dto/multi-provider.dto';

@ApiTags('Multi-Provider AI')
@Controller('ai/multi-provider')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MultiProviderController {
  constructor(private readonly multiProviderService: MultiProviderAIService) {}

  @Post('chat')
  @CanExecuteTools()
  @StandardRateLimit()
  @ApiOperation({
    summary: 'Chat with multiple AI providers',
    description: 'Send messages to various AI providers with smart routing and fallback capabilities',
  })
  @ApiBody({ type: MultiProviderChatDto })
  @ApiResponse({
    status: 200,
    description: 'Chat response from selected AI provider',
    schema: {
      type: 'object',
      properties: {
        response: { type: 'string', description: 'AI generated response' },
        provider: { type: 'string', description: 'Provider used for response' },
        model: { type: 'string', description: 'Specific model used' },
        executionTime: { type: 'number', description: 'Response time in milliseconds' },
        tokensUsed: { type: 'number', description: 'Estimated tokens consumed' },
      },
    },
  })
  async chat(@Body() body: MultiProviderChatDto) {
    try {
      const startTime = Date.now();
      const response = await this.multiProviderService.chatCompletion(
        body.messages,
        {
          provider: body.provider,
          fallbackProviders: body.fallbackProviders,
          useSmartRouting: body.useSmartRouting,
          temperature: body.temperature,
          maxTokens: body.maxTokens,
          model: body.model,
        },
      );
      const executionTime = Date.now() - startTime;

      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: {
          response,
          provider: body.provider || 'auto-selected',
          model: body.model || 'default',
          executionTime,
          tokensUsed: this.estimateTokens(body.messages, response),
        },
        message: ApiMessageKey.CHAT_COMPLETED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Post('generate')
  @CanExecuteTools()
  @StandardRateLimit()
  @ApiOperation({
    summary: 'Generate content with AI providers',
    description: 'Generate text content using the best available AI provider',
  })
  @ApiBody({ type: MultiProviderGenerateDto })
  @ApiResponse({
    status: 200,
    description: 'Generated content',
  })
  async generate(@Body() body: MultiProviderGenerateDto) {
    try {
      const startTime = Date.now();
      const response = await this.multiProviderService.generateText(
        body.prompt,
        {
          provider: body.provider,
          fallbackProviders: body.fallbackProviders,
          useSmartRouting: body.useSmartRouting,
          temperature: body.temperature,
          maxTokens: body.maxTokens,
          model: body.model,
        },
      );
      const executionTime = Date.now() - startTime;

      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: {
          response,
          provider: body.provider || 'auto-selected',
          model: body.model || 'default',
          executionTime,
          tokensUsed: this.estimateTokens([{ role: 'user', content: body.prompt }], response),
        },
        message: ApiMessageKey.CONTENT_GENERATED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Get('providers')
  @RequirePermissions('ai:read')
  @ApiOperation({
    summary: 'List available AI providers',
    description: 'Get all configured AI providers and their current status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available AI providers',
    type: [AIProviderStatusDto],
  })
  async getProviders() {
    try {
      const providers = await this.multiProviderService.getAvailableProviders();
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: providers,
        message: ApiMessageKey.PROVIDERS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Get('providers/:provider/capabilities')
  @RequirePermissions('ai:read')
  @ApiOperation({
    summary: 'Get provider capabilities',
    description: 'Get detailed capabilities and features of a specific AI provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider capabilities',
    type: ProviderCapabilitiesDto,
  })
  async getProviderCapabilities(@Param('provider') provider: string) {
    try {
      const capabilities = await this.multiProviderService.getProviderCapabilities(
        provider as AIProvider,
      );
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: capabilities,
        message: ApiMessageKey.PROVIDER_CAPABILITIES_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Get('stats')
  @RequirePermissions('ai:read')
  @ApiOperation({
    summary: 'Get multi-provider statistics',
    description: 'Get comprehensive statistics about all AI providers',
  })
  @ApiResponse({
    status: 200,
    description: 'Multi-provider statistics',
    type: ProviderStatsDto,
  })
  async getStats() {
    try {
      const stats = await this.multiProviderService.getProviderStats();
      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: stats,
        message: ApiMessageKey.STATISTICS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Post('compare')
  @RequirePermissions('ai:advanced')
  @StandardRateLimit()
  @ApiOperation({
    summary: 'Compare AI provider responses',
    description: 'Send the same prompt to multiple providers and compare responses',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt to send to all providers' },
        providers: {
          type: 'array',
          items: { type: 'string', enum: Object.values(AIProvider) },
          description: 'List of providers to compare',
        },
        maxTokens: { type: 'number', description: 'Maximum tokens per response' },
        temperature: { type: 'number', description: 'Temperature for all providers' },
      },
      required: ['prompt', 'providers'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Comparison results from multiple providers',
  })
  async compareProviders(@Body() body: {
    prompt: string;
    providers: AIProvider[];
    maxTokens?: number;
    temperature?: number;
  }) {
    try {
      const results = [];
      const startTime = Date.now();

      for (const provider of body.providers) {
        try {
          const providerStartTime = Date.now();
          const response = await this.multiProviderService.generateText(
            body.prompt,
            {
              provider,
              maxTokens: body.maxTokens || 1000,
              temperature: body.temperature || 0.7,
            },
          );
          const providerExecutionTime = Date.now() - providerStartTime;

          results.push({
            provider,
            response,
            executionTime: providerExecutionTime,
            tokensUsed: this.estimateTokens([{ role: 'user', content: body.prompt }], response),
            status: 'success',
          });
        } catch (error) {
          results.push({
            provider,
            response: null,
            executionTime: 0,
            tokensUsed: 0,
            status: 'error',
            error: error.message,
          });
        }
      }

      const totalExecutionTime = Date.now() - startTime;

      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: {
          prompt: body.prompt,
          results,
          totalExecutionTime,
          summary: {
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length,
            averageExecutionTime: results
              .filter(r => r.status === 'success')
              .reduce((sum, r) => sum + r.executionTime, 0) / 
              results.filter(r => r.status === 'success').length,
          },
        },
        message: ApiMessageKey.PROVIDER_COMPARISON_COMPLETED,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  @Post('stream')
  @CanExecuteTools()
  @StandardRateLimit()
  @ApiOperation({
    summary: 'Stream chat response',
    description: 'Stream AI response from selected provider in real-time',
  })
  @ApiBody({ type: MultiProviderChatDto })
  @ApiResponse({
    status: 200,
    description: 'Streaming response (Server-Sent Events)',
    headers: {
      'Content-Type': { description: 'text/plain; charset=utf-8' },
      'Cache-Control': { description: 'no-cache' },
      'Connection': { description: 'keep-alive' },
    },
  })
  async streamChat(@Body() body: MultiProviderChatDto) {
    // Note: This would typically return a streaming response
    // For now, we'll return a regular response indicating streaming capability
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: {
        message: 'Streaming endpoint - would return Server-Sent Events in real implementation',
        provider: body.provider || 'auto-selected',
        streamingSupported: true,
      },
      message: ApiMessageKey.STREAMING_CAPABILITIES_AVAILABLE,
      pagination: null,
    });
  }

  @Get('models')
  @RequirePermissions('ai:read')
  @ApiOperation({
    summary: 'List all available models',
    description: 'Get a comprehensive list of all models across all providers',
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    enum: AIProvider,
    description: 'Filter by specific provider',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available models',
  })
  async getModels(@Query('provider') provider?: AIProvider) {
    try {
      const models = [];
      const providers = provider ? [provider] : Object.values(AIProvider);

      for (const prov of providers) {
        try {
          const capabilities = await this.multiProviderService.getProviderCapabilities(prov);
          models.push({
            provider: prov,
            models: this.getProviderModels(prov),
            capabilities: capabilities.supportedFeatures,
            maxTokens: capabilities.maxTokens,
            costPer1kTokens: capabilities.costPer1kTokens,
          });
        } catch (error) {
          // Provider not configured, skip
        }
      }

      return new ApiResponseDto({
        statusCode: HttpStatus.OK,
        data: models,
        message: ApiMessageKey.MODELS_RETRIEVED_SUCCESS,
        pagination: null,
      });
    } catch (err) {
      throw err;
    }
  }

  private estimateTokens(messages: any[], response: string): number {
    const inputText = messages.map(m => m.content).join(' ');
    const totalText = inputText + response;
    return Math.ceil(totalText.length / 4); // Rough approximation: 4 chars = 1 token
  }

  private getProviderModels(provider: AIProvider): string[] {
    switch (provider) {
      case AIProvider.OPENAI:
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      case AIProvider.ANTHROPIC:
        return ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
      case AIProvider.GEMINI:
        return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
      case AIProvider.MISTRAL:
        return ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'];
      case AIProvider.COHERE:
        return ['command-r-plus', 'command-r', 'command-light'];
      default:
        return [];
    }
  }
}