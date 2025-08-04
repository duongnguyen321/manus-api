import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// Extend Request interface to include custom properties
interface AuthenticatedRequest extends Request {
  user?: any;
  apiKey?: any;
}
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Logger } from '@nestjs/common';

// Metadata keys for decorators
export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';
export const REQUIRE_API_KEY = 'require_api_key';
export const RATE_LIMIT_KEY = 'rate_limit';

@Injectable()
export class EnhancedAuthGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if API key is required
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(REQUIRE_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    let user = null;
    let apiKey = null;

    // Handle API key authentication
    if (requireApiKey) {
      apiKey = await this.validateApiKey(request);
      if (!apiKey) {
        throw new UnauthorizedException('Valid API key is required');
      }
      user = apiKey.user;
    } else {
      // Handle JWT authentication
      user = await this.validateJwtToken(request);
    }

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check rate limiting
    await this.checkRateLimit(context, request, user, apiKey);

    // Check role-based access
    await this.checkRoleAccess(context, user);

    // Check permission-based access
    await this.checkPermissionAccess(context, user, apiKey);

    // Attach user and apiKey to request
    request.user = user;
    request.apiKey = apiKey;

    return true;
  }

  private async validateJwtToken(request: Request) {
    const token = this.extractToken(request);
    if (!token) {
      return null;
    }

    try {
      const decoded = this.jwtService.verify(token);
      
      // Check if token is blacklisted
      const blacklistedToken = await this.prismaService.blackListAccessToken.findUnique({
        where: { token, expiredAt: { gte: new Date() } },
      });

      if (blacklistedToken) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('User not found or invalid session');
      }

      return user;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${error.message}`);
      return null;
    }
  }

  private async validateApiKey(request: Request) {
    const apiKeyValue = this.extractApiKey(request);
    if (!apiKeyValue) {
      return null;
    }

    try {
      // Check cache first
      const cachedKey = await this.redisService.get(`apikey:${apiKeyValue}`);
      if (cachedKey) {
        const apiKey = JSON.parse(cachedKey);
        if (apiKey.isActive && (!apiKey.expiresAt || new Date(apiKey.expiresAt) > new Date())) {
          return apiKey;
        }
      }

      // Check database
      const apiKey = await this.prismaService.apiKey.findUnique({
        where: { key: apiKeyValue },
        include: {
          user: true,
        },
      });

      if (apiKey?.isActive && (!apiKey.expiresAt || apiKey.expiresAt > new Date())) {
        // Cache for 5 minutes
        await this.redisService.setex(`apikey:${apiKeyValue}`, 300, JSON.stringify(apiKey));
        return apiKey;
      }

      return null;
    } catch (error) {
      this.logger.error(`API key validation failed: ${error.message}`);
      return null;
    }
  }

  private async checkRateLimit(
    context: ExecutionContext,
    request: Request,
    user: any,
    apiKey: any,
  ) {
    const rateLimitConfig = this.reflector.getAllAndOverride<{
      requests: number;
      window: number;
    }>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);

    if (!rateLimitConfig) {
      return; // No rate limiting configured
    }

    const identifier = apiKey?.id || user?.id || request.ip;
    const rateLimitKey = `rate_limit:${identifier}:${request.route?.path || request.path}`;
    
    const currentCount = await this.redisService.get(rateLimitKey);
    
    if (currentCount && parseInt(currentCount) >= rateLimitConfig.requests) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    // Increment counter
    if (currentCount) {
      await this.redisService.incr(rateLimitKey);
    } else {
      await this.redisService.setex(rateLimitKey, rateLimitConfig.window, '1');
    }
  }

  private async checkRoleAccess(context: ExecutionContext, user: any) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return; // No role requirements
    }

    const userRoles = user.roles?.map((role: any) => role.name) || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient role permissions');
    }
  }

  private async checkPermissionAccess(context: ExecutionContext, user: any, apiKey: any) {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return; // No permission requirements
    }

    // Collect permissions from user and API key
    const userPermissions = user.permissions?.map((perm: any) => perm.name) || [];
    const apiKeyPermissions = apiKey?.permissions?.map((perm: any) => perm.name) || [];
    const allPermissions = [...userPermissions, ...apiKeyPermissions];

    const hasRequiredPermission = requiredPermissions.some(permission => 
      allPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private extractApiKey(request: Request): string | null {
    // Check X-API-Key header
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
}