import { IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenerationType, TaskStatus } from '@prisma/client';

export class GenerateRequestDto {
  @ApiProperty({ description: 'Session ID for the generation task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Type of content to generate', enum: GenerationType })
  @IsEnum(GenerationType)
  type: GenerationType;

  @ApiProperty({ description: 'Generation prompt or instruction' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Generation parameters (model settings, etc.)' })
  @IsOptional()
  @IsObject()
  parameters?: any;

  @ApiPropertyOptional({ description: 'Process generation in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;

  @ApiPropertyOptional({ description: 'Priority for background processing (0-10)', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;
}

export class GenerateTextDto {
  @ApiProperty({ description: 'Session ID for the generation task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Text generation prompt' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Maximum tokens to generate' })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Temperature for generation (0.0-2.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Model to use for generation' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Process in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;
}

export class GenerateCodeDto {
  @ApiProperty({ description: 'Session ID for the generation task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Code generation prompt or specification' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Programming language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Code style/framework preferences' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ description: 'Include comments in generated code', default: true })
  @IsOptional()
  @IsBoolean()
  includeComments?: boolean;

  @ApiPropertyOptional({ description: 'Process in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;
}

export class GenerateImageDto {
  @ApiProperty({ description: 'Session ID for the generation task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Image generation prompt' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Image size', enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'] })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Image style' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ description: 'Number of images to generate' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  count?: number;

  @ApiPropertyOptional({ description: 'Process in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;
}

export class GenerationTaskResponseDto {
  @ApiProperty({ description: 'Task ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Generation type', enum: GenerationType })
  taskType: GenerationType;

  @ApiProperty({ description: 'Generation prompt' })
  prompt: string;

  @ApiPropertyOptional({ description: 'Generation parameters' })
  parameters?: any;

  @ApiPropertyOptional({ description: 'Generated result' })
  result?: string;

  @ApiProperty({ description: 'Task status', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: 'Task creation time' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Task completion time' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Queue job ID if processing in background' })
  queueJobId?: string;
}

export class GenerationHistoryResponseDto {
  @ApiProperty({ description: 'List of generation tasks', type: [GenerationTaskResponseDto] })
  tasks: GenerationTaskResponseDto[];

  @ApiProperty({ description: 'Total task count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  limit: number;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;
}