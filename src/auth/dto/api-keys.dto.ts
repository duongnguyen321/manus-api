import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, IsDateString } from 'class-validator';

export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  ADMIN = 'admin',
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name/description', example: 'Production API Key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'API key description', example: 'Used for production integrations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'API key scopes/permissions',
    enum: ApiKeyScope,
    isArray: true,
    example: [ApiKeyScope.READ, ApiKeyScope.EXECUTE]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ApiKeyScope, { each: true })
  scopes?: ApiKeyScope[];

  @ApiPropertyOptional({ description: 'Monthly usage limit', example: 10000 })
  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

  @ApiPropertyOptional({ description: 'Rate limit per hour', example: 1000 })
  @IsOptional()
  @IsNumber()
  hourlyLimit?: number;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Allowed IP addresses', example: ['192.168.1.1', '10.0.0.0/8'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIps?: string[];

  @ApiPropertyOptional({ description: 'Allowed domains', example: ['example.com', 'api.example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];
}

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'API key name/description' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'API key description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'API key scopes/permissions',
    enum: ApiKeyScope,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ApiKeyScope, { each: true })
  scopes?: ApiKeyScope[];

  @ApiPropertyOptional({ description: 'Monthly usage limit' })
  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

  @ApiPropertyOptional({ description: 'Rate limit per hour' })
  @IsOptional()
  @IsNumber()
  hourlyLimit?: number;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Allowed IP addresses' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIps?: string[];

  @ApiPropertyOptional({ description: 'Allowed domains' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];
}

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'API key ID', example: 'ak_1234567890abcdef' })
  id: string;

  @ApiProperty({ description: 'API key name', example: 'Production API Key' })
  name: string;

  @ApiPropertyOptional({ description: 'API key description' })
  description?: string;

  @ApiProperty({ description: 'API key value (only shown once)', example: 'sk_live_1234567890abcdef...' })
  key: string;

  @ApiProperty({ description: 'API key prefix for identification', example: 'sk_live_1234' })
  keyPrefix: string;

  @ApiProperty({ description: 'Active status', example: true })
  isActive: boolean;

  @ApiProperty({ 
    description: 'API key scopes/permissions',
    enum: ApiKeyScope,
    isArray: true
  })
  scopes: ApiKeyScope[];

  @ApiPropertyOptional({ description: 'Monthly usage limit' })
  monthlyLimit?: number;

  @ApiPropertyOptional({ description: 'Rate limit per hour' })
  hourlyLimit?: number;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Allowed IP addresses' })
  allowedIps?: string[];

  @ApiPropertyOptional({ description: 'Allowed domains' })
  allowedDomains?: string[];

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last updated date', example: '2024-01-01T00:00:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Last used date' })
  lastUsedAt?: string;

  @ApiProperty({ description: 'Total usage count', example: 1250 })
  totalUsage: number;

  @ApiProperty({ description: 'Current month usage', example: 150 })
  currentMonthUsage: number;
}

export class ApiKeyUsageDto {
  @ApiProperty({ description: 'API key ID' })
  apiKeyId: string;

  @ApiProperty({ description: 'Total requests', example: 15420 })
  totalRequests: number;

  @ApiProperty({ description: 'Successful requests', example: 14890 })
  successfulRequests: number;

  @ApiProperty({ description: 'Failed requests', example: 530 })
  failedRequests: number;

  @ApiProperty({ description: 'Current month usage', example: 1250 })
  currentMonthUsage: number;

  @ApiProperty({ description: 'Daily usage breakdown' })
  dailyUsage: Array<{
    date: string;
    requests: number;
    successful: number;
    failed: number;
  }>;

  @ApiProperty({ description: 'Endpoint usage breakdown' })
  endpointUsage: Array<{
    endpoint: string;
    requests: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Response time statistics' })
  responseTimeStats: {
    average: number;
    min: number;
    max: number;
    p95: number;
  };

  @ApiProperty({ description: 'Error breakdown' })
  errorBreakdown: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional({ description: 'Geographic usage distribution' })
  geographicUsage?: Array<{
    country: string;
    requests: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Usage period' })
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export class ApiKeyRotationResponseDto {
  @ApiProperty({ description: 'New API key details' })
  newApiKey: ApiKeyResponseDto;

  @ApiProperty({ description: 'Old API key ID (scheduled for deletion)' })
  oldApiKeyId: string;

  @ApiProperty({ description: 'Grace period end date (when old key will be deleted)' })
  gracePeriodEnds: string;

  @ApiProperty({ description: 'Migration instructions' })
  migrationInstructions: string;
}