import { ROLES_KEY } from '../decorators/roles.decorator';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleUser, User } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleUser[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request: Request = context.switchToHttp().getRequest();
    const user = request?.user;
    if (!user) return false;
    if (!requiredRoles) return true;
    return requiredRoles.includes((user as User)?.role);
  }
}
