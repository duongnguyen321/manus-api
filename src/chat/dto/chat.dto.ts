import { IsString, IsOptional, IsBoolean, IsArray, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({ description: 'Session ID for the chat' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Message metadata (attachments, context, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Process message in background', default: true })
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

export class ChatMessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Message role', enum: MessageRole })
  role: MessageRole;

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiPropertyOptional({ description: 'Message metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Message timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Whether message has been processed' })
  isProcessed: boolean;

  @ApiPropertyOptional({ description: 'Queue job ID if processing in background' })
  queueJobId?: string;
}

export class ChatHistoryResponseDto {
  @ApiProperty({ description: 'List of chat messages', type: [ChatMessageResponseDto] })
  messages: ChatMessageResponseDto[];

  @ApiProperty({ description: 'Total message count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  limit: number;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;
}

export class StreamChatDto {
  @ApiProperty({ description: 'Session ID for the chat' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Enable streaming response', default: true })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ description: 'Message metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class ChatSessionStatsDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Total messages in session' })
  totalMessages: number;

  @ApiProperty({ description: 'Messages by role count' })
  messagesByRole: Record<string, number>;

  @ApiProperty({ description: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Last message timestamp' })
  lastMessageAt: Date;

  @ApiProperty({ description: 'Session created timestamp' })
  sessionCreatedAt: Date;

  @ApiProperty({ description: 'Pending/processing messages count' })
  pendingMessages: number;
}