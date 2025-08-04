// src/auth/guards/Auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const accessToken = request.headers['authorization']?.split(' ')[1];
    if (!accessToken) {
      throw new UnauthorizedException('Access token not provided');
    }

    try {
      const decoded = this.jwtService.verify(accessToken);
      const blacklistedToken =
        await this.prisma.blackListAccessToken.findUnique({
          where: { token: accessToken, expiredAt: { gte: new Date() } },
        });
      if (blacklistedToken) {
        throw new UnauthorizedException('Access token is blacklisted');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException(
          'User not found or dont have refresh token',
        );
      }
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error?.message || 'Invalid or expired access token',
      );
    }
  }
}
