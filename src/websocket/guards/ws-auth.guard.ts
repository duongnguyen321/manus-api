import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Authentication token required');
      }

      // Verify JWT token
      const decoded = this.jwtService.verify(token);
      
      // Check if token is blacklisted
      const blacklistedToken = await this.prismaService.blackListAccessToken.findUnique({
        where: { token, expiredAt: { gte: new Date() } },
      });

      if (blacklistedToken) {
        throw new WsException('Token is blacklisted');
      }

      // Get user information
      const user = await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.refreshToken) {
        throw new WsException('User not found or invalid session');
      }

      // Rate limiting check
      await this.checkRateLimit(user.id, client.handshake.address);

      // Attach user to socket for later use
      client.data.user = user;
      client.data.userId = user.id;

      return true;
    } catch (error) {
      this.logger.warn(`WebSocket authentication failed: ${error.message}`);
      throw new WsException('Authentication failed');
    }
  }

  private extractToken(client: Socket): string | null {
    // Check authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check auth object from client
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Check query parameters
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  private async checkRateLimit(userId: string, ipAddress: string): Promise<void> {
    const rateLimitKey = `ws_rate_limit:${userId}:${ipAddress}`;
    const currentCount = await this.redisService.get(rateLimitKey);
    
    const limit = 100; // 100 connections per hour
    const window = 3600; // 1 hour in seconds

    if (currentCount && parseInt(currentCount) >= limit) {
      throw new WsException('Rate limit exceeded');
    }

    // Increment counter
    if (currentCount) {
      await this.redisService.incr(rateLimitKey);
    } else {
      await this.redisService.setex(rateLimitKey, window, '1');
    }
  }
}