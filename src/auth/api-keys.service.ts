import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import {
  CreateApiKeyDto,
  UpdateApiKeyDto,
  ApiKeyResponseDto,
  ApiKeyUsageDto,
  ApiKeyRotationResponseDto,
} from './dto/api-keys.dto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async createApiKey(data: CreateApiKeyDto & { userId: string }): Promise<ApiKeyResponseDto> {
    // Generate secure API key
    const keyValue = this.generateApiKey();
    const keyHash = this.hashApiKey(keyValue);
    const keyPrefix = keyValue.substring(0, 12) + '...';

    try {
      const apiKey = await this.prismaService.apiKey.create({
        data: {
          name: data.name,
          description: data.description,
          key: keyHash,
          keyPrefix,
          userId: data.userId,
          scopes: data.scopes || [],
          monthlyLimit: data.monthlyLimit,
          hourlyLimit: data.hourlyLimit,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          allowedIps: data.allowedIps || [],
          allowedDomains: data.allowedDomains || [],
          isActive: true,
        },
      });

      // Clear API key cache to force refresh
      await this.clearApiKeyCache(keyHash);

      return this.formatApiKeyResponse(apiKey, keyValue);
    } catch (error) {
      this.logger.error(`Failed to create API key: ${error.message}`);
      throw error;
    }
  }

  async listApiKeys(options: { userId: string; page: number; limit: number }) {
    const { page, limit, userId } = options;
    const offset = (page - 1) * limit;

    const [apiKeys, total] = await Promise.all([
      this.prismaService.apiKey.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.apiKey.count({ where: { userId } }),
    ]);

    // Get usage statistics for each API key
    const apiKeysWithUsage = await Promise.all(
      apiKeys.map(async (apiKey) => {
        const usage = await this.getCurrentMonthUsage(apiKey.id);
        return this.formatApiKeyResponse(apiKey, null, usage);
      }),
    );

    return {
      apiKeys: apiKeysWithUsage,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getApiKey(keyId: string, userId: string): Promise<ApiKeyResponseDto> {
    const apiKey = await this.prismaService.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const usage = await this.getCurrentMonthUsage(keyId);
    return this.formatApiKeyResponse(apiKey, null, usage);
  }

  async updateApiKey(
    keyId: string,
    data: UpdateApiKeyDto & { userId: string },
  ): Promise<ApiKeyResponseDto> {
    const existingKey = await this.prismaService.apiKey.findFirst({
      where: { id: keyId, userId: data.userId },
    });

    if (!existingKey) {
      throw new NotFoundException('API key not found');
    }

    const updatedApiKey = await this.prismaService.apiKey.update({
      where: { id: keyId },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        scopes: data.scopes,
        monthlyLimit: data.monthlyLimit,
        hourlyLimit: data.hourlyLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        allowedIps: data.allowedIps,
        allowedDomains: data.allowedDomains,
        updatedAt: new Date(),
      },
    });

    // Clear cache to force refresh
    await this.clearApiKeyCache(existingKey.key);

    const usage = await this.getCurrentMonthUsage(keyId);
    return this.formatApiKeyResponse(updatedApiKey, null, usage);
  }

  async deleteApiKey(keyId: string, userId: string): Promise<void> {
    const apiKey = await this.prismaService.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prismaService.apiKey.delete({
      where: { id: keyId },
    });

    // Clear cache
    await this.clearApiKeyCache(apiKey.key);
  }

  async regenerateApiKey(keyId: string, userId: string): Promise<ApiKeyResponseDto> {
    const existingKey = await this.prismaService.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!existingKey) {
      throw new NotFoundException('API key not found');
    }

    // Generate new API key
    const keyValue = this.generateApiKey();
    const keyHash = this.hashApiKey(keyValue);
    const keyPrefix = keyValue.substring(0, 12) + '...';

    const updatedApiKey = await this.prismaService.apiKey.update({
      where: { id: keyId },
      data: {
        key: keyHash,
        keyPrefix,
        updatedAt: new Date(),
      },
    });

    // Clear old cache
    await this.clearApiKeyCache(existingKey.key);

    const usage = await this.getCurrentMonthUsage(keyId);
    return this.formatApiKeyResponse(updatedApiKey, keyValue, usage);
  }

  async rotateApiKey(
    keyId: string,
    userId: string,
  ): Promise<ApiKeyRotationResponseDto> {
    const existingKey = await this.prismaService.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!existingKey) {
      throw new NotFoundException('API key not found');
    }

    // Create new API key with same settings
    const newApiKey = await this.createApiKey({
      name: `${existingKey.name} (Rotated)`,
      description: existingKey.description,
      scopes: existingKey.scopes as any[],
      monthlyLimit: existingKey.monthlyLimit,
      hourlyLimit: existingKey.hourlyLimit,
      expiresAt: existingKey.expiresAt?.toISOString(),
      allowedIps: existingKey.allowedIps as string[],
      allowedDomains: existingKey.allowedDomains as string[],
      userId,
    });

    // Schedule old key for deletion (30 days grace period)
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

    await this.prismaService.apiKey.update({
      where: { id: keyId },
      data: {
        scheduledForDeletion: gracePeriodEnd,
        isActive: false,
      },
    });

    return {
      newApiKey,
      oldApiKeyId: keyId,
      gracePeriodEnds: gracePeriodEnd.toISOString(),
      migrationInstructions: `Please update your applications to use the new API key within 30 days. The old key will be automatically deleted on ${gracePeriodEnd.toDateString()}.`,
    };
  }

  async getApiKeyUsage(keyId: string, days: number): Promise<ApiKeyUsageDto> {
    const apiKey = await this.prismaService.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage statistics from database
    const usage = await this.prismaService.apiKeyUsage.findMany({
      where: {
        apiKeyId: keyId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Process usage data
    const totalRequests = usage.length;
    const successfulRequests = usage.filter((u) => 
      u.endpoint.includes('200') || !u.endpoint.includes('error')
    ).length;
    const failedRequests = totalRequests - successfulRequests;

    // Daily usage breakdown
    const dailyUsage = this.calculateDailyUsage(usage, days);
    
    // Endpoint usage breakdown
    const endpointUsage = this.calculateEndpointUsage(usage);

    // Response time stats (placeholder - would need additional data)
    const responseTimeStats = {
      average: 250,
      min: 50,
      max: 2000,
      p95: 800,
    };

    // Error breakdown (placeholder)
    const errorBreakdown = [
      { statusCode: 400, count: Math.floor(failedRequests * 0.4), percentage: 40 },
      { statusCode: 401, count: Math.floor(failedRequests * 0.3), percentage: 30 },
      { statusCode: 500, count: Math.floor(failedRequests * 0.3), percentage: 30 },
    ];

    return {
      apiKeyId: keyId,
      totalRequests,
      successfulRequests,
      failedRequests,
      currentMonthUsage: await this.getCurrentMonthUsage(keyId),
      dailyUsage,
      endpointUsage,
      responseTimeStats,
      errorBreakdown,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
    };
  }

  private generateApiKey(): string {
    const prefix = 'sk_live_';
    const randomPart = randomBytes(32).toString('hex');
    return prefix + randomPart;
  }

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private async clearApiKeyCache(keyHash: string): Promise<void> {
    try {
      await this.redisService.del(`apikey:${keyHash}`);
    } catch (error) {
      this.logger.warn(`Failed to clear API key cache: ${error.message}`);
    }
  }

  private async getCurrentMonthUsage(keyId: string): Promise<number> {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const usageKey = `usage:${keyId}:${currentMonth}`;
    
    try {
      const usage = await this.redisService.get(usageKey);
      return usage ? parseInt(usage) : 0;
    } catch (error) {
      this.logger.warn(`Failed to get current month usage: ${error.message}`);
      return 0;
    }
  }

  private formatApiKeyResponse(
    apiKey: any,
    keyValue: string | null = null,
    currentMonthUsage: number = 0,
  ): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description,
      key: keyValue || '*'.repeat(32), // Only show full key on creation
      keyPrefix: apiKey.keyPrefix,
      isActive: apiKey.isActive,
      scopes: apiKey.scopes,
      monthlyLimit: apiKey.monthlyLimit,
      hourlyLimit: apiKey.hourlyLimit,
      expiresAt: apiKey.expiresAt?.toISOString(),
      allowedIps: apiKey.allowedIps,
      allowedDomains: apiKey.allowedDomains,
      createdAt: apiKey.createdAt.toISOString(),
      updatedAt: apiKey.updatedAt.toISOString(),
      lastUsedAt: apiKey.lastUsedAt?.toISOString(),
      totalUsage: apiKey.totalUsage || 0,
      currentMonthUsage,
    };
  }

  private calculateDailyUsage(usage: any[], days: number) {
    const dailyMap = new Map<string, { requests: number; successful: number; failed: number }>();
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { requests: 0, successful: 0, failed: 0 });
    }

    // Count usage per day
    usage.forEach((u) => {
      const dateStr = u.timestamp.toISOString().split('T')[0];
      const dayData = dailyMap.get(dateStr);
      if (dayData) {
        dayData.requests++;
        if (u.endpoint.includes('200') || !u.endpoint.includes('error')) {
          dayData.successful++;
        } else {
          dayData.failed++;
        }
      }
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateEndpointUsage(usage: any[]) {
    const endpointMap = new Map<string, number>();
    
    usage.forEach((u) => {
      const endpoint = u.endpoint.split(' ')[1] || u.endpoint; // Extract path from "GET /path"
      endpointMap.set(endpoint, (endpointMap.get(endpoint) || 0) + 1);
    });

    const total = usage.length;
    return Array.from(endpointMap.entries())
      .map(([endpoint, requests]) => ({
        endpoint,
        requests,
        percentage: Math.round((requests / total) * 100),
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10); // Top 10 endpoints
  }
}