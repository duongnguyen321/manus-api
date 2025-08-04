import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request & { apiKey?: any } = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Check rate limiting first
    await this.checkRateLimit(apiKey, request.ip);

    // Validate API key
    const apiKeyRecord = await this.validateApiKey(apiKey);
    
    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if API key is active and not expired
    if (!apiKeyRecord.isActive || (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date())) {
      throw new ForbiddenException('API key is inactive or expired');
    }

    // Check usage limits
    await this.checkUsageLimits(apiKeyRecord);

    // Log API key usage
    await this.logApiKeyUsage(apiKeyRecord.id, request);

    // Attach API key info to request
    request.apiKey = apiKeyRecord;

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Check multiple sources for API key
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check API-Key header
    const apiKeyHeader = request.headers['x-api-key'] || request.headers['api-key'];
    if (apiKeyHeader) {
      return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }

    // Check query parameter
    const queryApiKey = request.query.api_key;
    if (queryApiKey) {
      return Array.isArray(queryApiKey) ? queryApiKey[0] as string : queryApiKey as string;
    }

    return null;
  }

  private async validateApiKey(apiKey: string) {
    try {
      // First check Redis cache
      const cachedKey = await this.redisService.get(`apikey:${apiKey}`);
      if (cachedKey) {
        return JSON.parse(cachedKey);
      }

      // If not in cache, check database
      const apiKeyRecord = await this.prismaService.apiKey.findUnique({
        where: { key: apiKey },
        include: {
          user: true,
        },
      });

      if (apiKeyRecord) {
        // Cache for 5 minutes
        await this.redisService.setex(`apikey:${apiKey}`, 300, JSON.stringify(apiKeyRecord));
      }

      return apiKeyRecord;
    } catch (error) {
      this.logger.error(`API key validation failed: ${error.message}`);
      return null;
    }
  }

  private async checkRateLimit(apiKey: string, ip: string) {
    const rateLimitKey = `rate_limit:${apiKey}:${ip}`;
    const currentCount = await this.redisService.get(rateLimitKey);
    
    const limit = this.configService.get<number>('API_RATE_LIMIT', 1000); // requests per hour
    const window = 3600; // 1 hour in seconds

    if (currentCount && parseInt(currentCount) >= limit) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    // Increment counter
    if (currentCount) {
      await this.redisService.incr(rateLimitKey);
    } else {
      await this.redisService.setex(rateLimitKey, window, '1');
    }
  }

  private async checkUsageLimits(apiKeyRecord: any) {
    if (apiKeyRecord.monthlyLimit) {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const usageKey = `usage:${apiKeyRecord.id}:${currentMonth}`;
      const currentUsage = await this.redisService.get(usageKey);

      if (currentUsage && parseInt(currentUsage) >= apiKeyRecord.monthlyLimit) {
        throw new ForbiddenException('Monthly usage limit exceeded');
      }
    }
  }

  private async logApiKeyUsage(apiKeyId: string, request: Request) {
    try {
      // Increment usage counter
      const currentMonth = new Date().toISOString().substring(0, 7);
      const usageKey = `usage:${apiKeyId}:${currentMonth}`;
      await this.redisService.incr(usageKey);
      await this.redisService.expire(usageKey, 2678400); // 31 days

      // Log detailed usage (async, don't block request)
      setImmediate(async () => {
        try {
          await this.prismaService.apiKeyUsage.create({
            data: {
              apiKeyId,
              endpoint: request.path || '/',
              method: request.method || 'GET',
              statusCode: 200,
              responseTime: 0,
              userAgent: request.headers['user-agent'] || '',
              ipAddress: request.ip || '127.0.0.1',
            },
          });
        } catch (error) {
          this.logger.warn(`Failed to log API key usage: ${error.message}`);
        }
      });
    } catch (error) {
      this.logger.warn(`Failed to track API key usage: ${error.message}`);
    }
  }
}