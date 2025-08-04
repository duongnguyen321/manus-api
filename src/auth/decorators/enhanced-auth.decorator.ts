import { SetMetadata } from '@nestjs/common';

// Permissions decorator
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// Roles decorator (enhanced)
export const RequireRoles = (...roles: string[]) =>
  SetMetadata('roles', roles);

// API Key requirement decorator
export const RequireApiKey = () => SetMetadata('require_api_key', true);

// Rate limiting decorator
export const RateLimit = (requests: number, windowSeconds: number) =>
  SetMetadata('rate_limit', { requests, window: windowSeconds });

// Combined auth decorator for convenience
export const Auth = (options: {
  roles?: string[];
  permissions?: string[];
  requireApiKey?: boolean;
  rateLimit?: { requests: number; window: number };
} = {}) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (options.roles) {
      RequireRoles(...options.roles)(target, propertyKey, descriptor);
    }
    if (options.permissions) {
      RequirePermissions(...options.permissions)(target, propertyKey, descriptor);
    }
    if (options.requireApiKey) {
      RequireApiKey()(target, propertyKey, descriptor);
    }
    if (options.rateLimit) {
      RateLimit(options.rateLimit.requests, options.rateLimit.window)(target, propertyKey, descriptor);
    }
  };
};

// Specific permission decorators for common actions
export const CanReadAgents = () => RequirePermissions('agents:read');
export const CanExecuteTools = () => RequirePermissions('tools:execute');
export const CanManageUsers = () => RequirePermissions('users:manage');
export const CanAccessAnalytics = () => RequirePermissions('analytics:read');
export const CanManageSystem = () => RequirePermissions('system:manage');

// Role-based decorators
export const AdminOnly = () => RequireRoles('admin');
export const ModeratorOrAdmin = () => RequireRoles('moderator', 'admin');
export const PremiumUser = () => RequireRoles('premium', 'admin');

// Rate limiting presets
export const StandardRateLimit = () => RateLimit(100, 3600); // 100 requests per hour
export const StrictRateLimit = () => RateLimit(10, 3600);   // 10 requests per hour
export const BurstRateLimit = () => RateLimit(1000, 60);   // 1000 requests per minute