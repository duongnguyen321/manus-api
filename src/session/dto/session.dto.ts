import { IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export class CreateSessionDto {
  @ApiProperty({ description: 'User ID (optional for anonymous sessions)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Session metadata configuration' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Session expiration time', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ description: 'Session status', enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ description: 'Session metadata configuration' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Session expiration time', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SessionConfigDto {
  @ApiPropertyOptional({ description: 'Enable browser automation for this session', default: false })
  @IsOptional()
  @IsBoolean()
  browserEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable AI processing for this session', default: true })
  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable background queue processing', default: true })
  @IsOptional()
  @IsBoolean()
  queueEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Maximum concurrent tasks for this session', default: 5 })
  @IsOptional()
  maxConcurrentTasks?: number;

  @ApiPropertyOptional({ description: 'Custom session settings' })
  @IsOptional()
  @IsObject()
  settings?: any;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Session status', enum: SessionStatus })
  status: SessionStatus;

  @ApiPropertyOptional({ description: 'User ID if authenticated' })
  userId?: string;

  @ApiProperty({ description: 'Session creation time' })
  createdAt: Date;

  @ApiProperty({ description: 'Last session access time' })
  lastAccessedAt: Date;

  @ApiPropertyOptional({ description: 'Session expiration time' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Session metadata' })
  metadata?: any;
}

export class SessionListResponseDto {
  @ApiProperty({ description: 'List of sessions', type: [SessionResponseDto] })
  sessions: SessionResponseDto[];

  @ApiProperty({ description: 'Total count of sessions' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  limit: number;
}