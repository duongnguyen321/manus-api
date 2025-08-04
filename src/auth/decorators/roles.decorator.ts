import { SetMetadata } from '@nestjs/common';
import type { RoleUser } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleUser[]) => SetMetadata(ROLES_KEY, roles);
