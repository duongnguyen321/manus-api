import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { AIProvider } from '../multi-provider.service';

export class ChatMessageDto {
  @ApiProperty({ 
    description: 'Message role',
    enum: ['user', 'assistant', 'system'],
    example: 'user'
  })
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ 
    description: 'Message content',
    example: 'Hello, how can you help me today?'
  })
  @IsString()
  content: string;
}

export class MultiProviderChatDto {
  @ApiProperty({ 
    description: 'Conversation messages',
    type: [ChatMessageDto],
    example: [
      { role: 'user', content: 'What is artificial intelligence?' }
    ]
  })
  @IsArray()
  messages: ChatMessageDto[];

  @ApiPropertyOptional({ 
    description: 'Preferred AI provider',
    enum: AIProvider,
    example: AIProvider.OPENAI
  })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @ApiPropertyOptional({ 
    description: 'Fallback providers if primary fails',
    enum: AIProvider,
    isArray: true,
    example: [AIProvider.ANTHROPIC, AIProvider.GEMINI]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AIProvider, { each: true })
  fallbackProviders?: AIProvider[];

  @ApiPropertyOptional({ 
    description: 'Use smart routing to select optimal provider',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  useSmartRouting?: boolean;

  @ApiPropertyOptional({ 
    description: 'Response creativity (0.0 - 2.0)',
    example: 0.7,
    minimum: 0,
    maximum: 2
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum tokens in response',
    example: 2000,
    minimum: 1,
    maximum: 32000
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32000)
  maxTokens?: number;

  @ApiPropertyOptional({ 
    description: 'Specific model to use (overrides provider default)',
    example: 'gpt-4o'
  })
  @IsOptional()
  @IsString()
  model?: string;
}

export class MultiProviderGenerateDto {
  @ApiProperty({ 
    description: 'Text prompt for generation',
    example: 'Write a creative story about a robot learning to paint'
  })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ 
    description: 'Preferred AI provider',
    enum: AIProvider
  })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @ApiPropertyOptional({ 
    description: 'Fallback providers if primary fails',
    enum: AIProvider,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AIProvider, { each: true })
  fallbackProviders?: AIProvider[];

  @ApiPropertyOptional({ 
    description: 'Use smart routing to select optimal provider',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  useSmartRouting?: boolean;

  @ApiPropertyOptional({ 
    description: 'Response creativity (0.0 - 2.0)',
    example: 0.7
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum tokens in response',
    example: 2000
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32000)
  maxTokens?: number;

  @ApiPropertyOptional({ 
    description: 'Specific model to use',
    example: 'claude-3-5-sonnet-20241022'
  })
  @IsOptional()
  @IsString()
  model?: string;
}

export class AIProviderStatusDto {
  @ApiProperty({ 
    description: 'AI provider name',
    enum: AIProvider,
    example: AIProvider.OPENAI
  })
  provider: AIProvider;

  @ApiProperty({ 
    description: 'Default model for this provider',
    example: 'gpt-4o'
  })
  model: string;

  @ApiProperty({ 
    description: 'Provider availability status',
    enum: ['available', 'error'],
    example: 'available'
  })
  status: 'available' | 'error';

  @ApiPropertyOptional({ 
    description: 'Error message if status is error'
  })
  error?: string;

  @ApiPropertyOptional({ 
    description: 'Last health check timestamp'
  })
  lastChecked?: string;
}

export class ProviderCapabilitiesDto {
  @ApiProperty({ 
    description: 'Supported features',
    example: ['text_generation', 'function_calling', 'vision']
  })
  supportedFeatures: string[];

  @ApiProperty({ 
    description: 'Maximum tokens supported',
    example: 8000
  })
  maxTokens: number;

  @ApiProperty({ 
    description: 'Supports streaming responses',
    example: true
  })
  supportsStreaming: boolean;

  @ApiProperty({ 
    description: 'Supports tool/function calling',
    example: true
  })
  supportsTools: boolean;

  @ApiPropertyOptional({ 
    description: 'Cost per 1000 tokens (USD)',
    example: 0.002
  })
  costPer1kTokens?: number;

  @ApiPropertyOptional({ 
    description: 'Supported languages',
    example: ['en', 'es', 'fr', 'de', 'zh']
  })
  supportedLanguages?: string[];

  @ApiPropertyOptional({ 
    description: 'Context window size',
    example: 128000
  })
  contextWindow?: number;

  @ApiPropertyOptional({ 
    description: 'Training data cutoff date',
    example: '2024-04-01'
  })
  trainingDataCutoff?: string;
}

export class ProviderStatsDto {
  @ApiProperty({ 
    description: 'Total number of configured providers',
    example: 5
  })
  totalProviders: number;

  @ApiProperty({ 
    description: 'Number of currently active providers',
    example: 4
  })
  activeProviders: number;

  @ApiProperty({ 
    description: 'Health status of each provider',
    example: {
      openai: true,
      anthropic: true,
      gemini: false,
      mistral: true,
      cohere: true
    }
  })
  providerHealth: Record<AIProvider, boolean>;

  @ApiProperty({ 
    description: 'Recommended provider based on current health',
    enum: AIProvider,
    example: AIProvider.ANTHROPIC
  })
  recommendedProvider: AIProvider;

  @ApiPropertyOptional({ 
    description: 'Response time statistics per provider (ms)'
  })
  responseTimeStats?: Record<AIProvider, {
    average: number;
    min: number;
    max: number;
    last24h: number;
  }>;

  @ApiPropertyOptional({ 
    description: 'Usage statistics per provider'
  })
  usageStats?: Record<AIProvider, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageTokensPerRequest: number;
  }>;
}

export class ProviderComparisonDto {
  @ApiProperty({ 
    description: 'The prompt used for comparison',
    example: 'Explain quantum computing in simple terms'
  })
  prompt: string;

  @ApiProperty({ 
    description: 'Comparison results from each provider'
  })
  results: Array<{
    provider: AIProvider;
    response: string | null;
    executionTime: number;
    tokensUsed: number;
    status: 'success' | 'error';
    error?: string;
  }>;

  @ApiProperty({ 
    description: 'Total execution time for all providers',
    example: 5420
  })
  totalExecutionTime: number;

  @ApiProperty({ 
    description: 'Summary statistics'
  })
  summary: {
    successful: number;
    failed: number;
    averageExecutionTime: number;
  };
}

export class ModelInfoDto {
  @ApiProperty({ 
    description: 'Provider that owns this model',
    enum: AIProvider
  })
  provider: AIProvider;

  @ApiProperty({ 
    description: 'Available models for this provider',
    example: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
  })
  models: string[];

  @ApiProperty({ 
    description: 'Model capabilities',
    example: ['text_generation', 'function_calling', 'vision']
  })
  capabilities: string[];

  @ApiProperty({ 
    description: 'Maximum tokens supported',
    example: 128000
  })
  maxTokens: number;

  @ApiPropertyOptional({ 
    description: 'Cost per 1000 tokens (USD)',
    example: 0.002
  })
  costPer1kTokens?: number;

  @ApiPropertyOptional({ 
    description: 'Model performance rating (1-10)',
    example: 9.2
  })
  performanceRating?: number;

  @ApiPropertyOptional({ 
    description: 'Model release date',
    example: '2024-05-13'
  })
  releaseDate?: string;
}

export class StreamingConfigDto {
  @ApiPropertyOptional({ 
    description: 'Enable streaming response',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ 
    description: 'Chunk size for streaming (characters)',
    example: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  chunkSize?: number;

  @ApiPropertyOptional({ 
    description: 'Delay between chunks (milliseconds)',
    example: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5000)
  chunkDelay?: number;
}

export class ProviderPreferencesDto {
  @ApiProperty({ 
    description: 'User ID',
    example: 'user-123'
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ 
    description: 'Preferred provider for general tasks',
    enum: AIProvider
  })
  @IsOptional()
  @IsEnum(AIProvider)
  defaultProvider?: AIProvider;

  @ApiPropertyOptional({ 
    description: 'Provider preferences by task type'
  })
  @IsOptional()
  taskPreferences?: {
    coding?: AIProvider;
    creative?: AIProvider;
    analysis?: AIProvider;
    translation?: AIProvider;
  };

  @ApiPropertyOptional({ 
    description: 'Maximum cost per request (USD)',
    example: 0.05
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCostPerRequest?: number;

  @ApiPropertyOptional({ 
    description: 'Preferred response time vs quality trade-off (1-10)',
    example: 7
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  speedVsQualityPreference?: number;
}