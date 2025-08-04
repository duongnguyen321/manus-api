import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EditOperation, TaskStatus } from '@prisma/client';

export class EditRequestDto {
  @ApiProperty({ description: 'Session ID for the edit task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Edit operation type', enum: EditOperation })
  @IsEnum(EditOperation)
  operation: EditOperation;

  @ApiProperty({ description: 'Target file path or content identifier' })
  @IsString()
  target: string;

  @ApiProperty({ description: 'Edit instruction or description' })
  @IsString()
  instruction: string;

  @ApiPropertyOptional({ description: 'Original content (for updates)' })
  @IsOptional()
  @IsString()
  originalContent?: string;

  @ApiPropertyOptional({ description: 'Process edit in background', default: true })
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

export class CreateFileDto {
  @ApiProperty({ description: 'Session ID for the edit task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'File path to create' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'File content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Process in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;
}

export class UpdateFileDto {
  @ApiProperty({ description: 'Session ID for the edit task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'File path to update' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'Update instruction' })
  @IsString()
  instruction: string;

  @ApiPropertyOptional({ description: 'Original content' })
  @IsOptional()
  @IsString()
  originalContent?: string;

  @ApiPropertyOptional({ description: 'Process in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;
}

export class RefactorCodeDto {
  @ApiProperty({ description: 'Session ID for the edit task' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'File or code path to refactor' })
  @IsString()
  target: string;

  @ApiProperty({ description: 'Refactoring instruction' })
  @IsString()
  instruction: string;

  @ApiPropertyOptional({ description: 'Original code content' })
  @IsOptional()
  @IsString()
  originalContent?: string;

  @ApiPropertyOptional({ description: 'Refactoring type' })
  @IsOptional()
  @IsString()
  refactoringType?: string;

  @ApiPropertyOptional({ description: 'Process in background', default: true })
  @IsOptional()
  @IsBoolean()
  processInBackground?: boolean;
}

export class EditTaskResponseDto {
  @ApiProperty({ description: 'Task ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Edit operation', enum: EditOperation })
  operation: EditOperation;

  @ApiProperty({ description: 'Target file or content path' })
  target: string;

  @ApiProperty({ description: 'Edit instruction' })
  instruction: string;

  @ApiPropertyOptional({ description: 'Original content' })
  originalContent?: string;

  @ApiPropertyOptional({ description: 'Modified content' })
  modifiedContent?: string;

  @ApiProperty({ description: 'Task status', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: 'Task creation time' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Task completion time' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Queue job ID if processing in background' })
  queueJobId?: string;
}

export class EditHistoryResponseDto {
  @ApiProperty({ description: 'List of edit tasks', type: [EditTaskResponseDto] })
  tasks: EditTaskResponseDto[];

  @ApiProperty({ description: 'Total task count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  limit: number;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;
}