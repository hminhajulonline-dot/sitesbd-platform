// ============================================
// Auth Middleware
// ============================================

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthContext, RoleType } from '../types';
import { RoleResolver } from '../permissions/role-resolver';
import { PermissionResolver } from '../permissions/permission-resolver';

export interface AuthMiddlewareConfig {
  supabase: SupabaseClient;
  publicRoutes?: string[];
  protectedRoutes?: string[];
  adminRoutes?: string[];
}

export interface MiddlewareResult {
  allowed: boolean;
  context?: AuthContext;
  error?: {
    code: string;
    message: string;
  };
  redirectTo?: string;
}

export class AuthMiddleware {
  private supabase: SupabaseClient;
  private roleResolver: RoleResolver;
  private permissionResolver: PermissionResolver;
  private publicRoutes: Set<string>;
  private protectedRoutes: Set<string>;
  private adminRoutes: Set<string>;

  constructor(config: AuthMiddlewareConfig) {
    this.supabase = config.supabase;
    this.roleResolver = new RoleResolver({ supabase: config.supabase });
    this.permissionResolver = new PermissionResolver({ supabase: config.supabase });
    this.publicRoutes = new Set(config.publicRoutes || ['/login', '/register', '/forgot-password']);
    this.protectedRoutes = new Set(config.protectedRoutes || ['/dashboard', '/profile', '/settings']);
    this.adminRoutes = new Set(config.adminRoutes || ['/admin', '/users', '/roles']);
  }

  async handle(request: NextRequest): Promise<MiddlewareResult> {
    const pathname = request.nextUrl.pathname;

    // Check if route is public
    if (this.isPublicRoute(pathname)) {
      return { allowed: true };
    }

    // Get auth token from cookies or header
    const token = this.extractToken(request);
    if (!token) {
      return {
        allowed: false,
        error: { code: 'NO_TOKEN', message: 'Authentication required' },
        redirectTo: '/login',
      };
    }

    // Verify token and get user
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) {
      return {
        allowed: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        redirectTo: '/login',
      };
    }

    // Build auth context
    const context = await this.buildAuthContext(user.id);
    if (!context) {
      return {
        allowed: false,
        error: { code: 'CONTEXT_ERROR', message: 'Failed to build auth context' },
        redirectTo: '/login',
      };
    }

    // Check route protection level
    if (this.isAdminRoute(pathname)) {
      if (!this.hasAdminAccess(context)) {
        return {
          allowed: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
          redirectTo: '/dashboard',
        };
      }
    } else if (this.isProtectedRoute(pathname)) {
      if (!context.isAuthenticated) {
        return {
          allowed: false,
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
          redirectTo: '/login',
        };
      }
    }

    return { allowed: true, context };
  }

  private extractToken(request: NextRequest): string | null {
    // Try cookie first
    const cookieToken = request.cookies.get('sb-access-token')?.value;
    if (cookieToken) return cookieToken;

    // Try authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private isPublicRoute(pathname: string): boolean {
    return Array.from(this.publicRoutes).some((route) => pathname.startsWith(route));
  }

  private isProtectedRoute(pathname: string): boolean {
    return Array.from(this.protectedRoutes).some((route) => pathname.startsWith(route));
  }

  private isAdminRoute(pathname: string): boolean {
    return Array.from(this.adminRoutes).some((route) => pathname.startsWith(route));
  }

  private hasAdminAccess(context: AuthContext): boolean {
    return context.roles.some((role) =>
      ['system_owner', 'super_admin', 'admin'].includes(role.roleType)
    );
  }

  private async buildAuthContext(userId: string): Promise<AuthContext | null> {
    try {
      const [rolesResult, permissionsResult] = await Promise.all([
        this.roleResolver.getUserRoles(userId),
        this.permissionResolver.getUserPermissions(userId),
      ]);

      return {
        user: {
          id: userId,
          email: '',
          emailVerified: false,
          createdAt: '',
          updatedAt: '',
          lastSignInAt: null,
          metadata: {},
        },
        session: null,
        roles: rolesResult.data || [],
        permissions: permissionsResult.data || [],
        isAuthenticated: true,
      };
    } catch {
      return null;
    }
  }
}

// ============================================
// Auth Guards
// ============================================

export interface GuardConfig {
  requireAuth?: boolean;
  requireRole?: RoleType | RoleType[];
  requirePermission?: string | string[];
}

export function createAuthGuard(config: GuardConfig) {
  return async (context: AuthContext): Promise<{ allowed: boolean; error?: string }> => {
    // Check authentication
    if (config.requireAuth && !context.isAuthenticated) {
      return { allowed: false, error: 'Authentication required' };
    }

    // Check role
    if (config.requireRole) {
      const requiredRoles = Array.isArray(config.requireRole)
        ? config.requireRole
        : [config.requireRole];

      const hasRequiredRole = context.roles.some((role) =>
        requiredRoles.includes(role.roleType)
      );

      if (!hasRequiredRole) {
        return { allowed: false, error: 'Insufficient permissions' };
      }
    }

    // Check permission
    if (config.requirePermission) {
      const requiredPermissions = Array.isArray(config.requirePermission)
        ? config.requirePermission
        : [config.requirePermission];

      const hasRequiredPermission = requiredPermissions.every((perm) =>
        context.permissions.includes(perm)
      );

      if (!hasRequiredPermission) {
        return { allowed: false, error: 'Insufficient permissions' };
      }
    }

    return { allowed: true };
  };
}

// Pre-configured guards
export const guards = {
  requireAuth: createAuthGuard({ requireAuth: true }),

  requireUser: createAuthGuard({
    requireAuth: true,
    requireRole: 'user',
  }),

  requireAdmin: createAuthGuard({
    requireAuth: true,
    requireRole: ['admin', 'super_admin', 'system_owner'],
  }),

  requireSuperAdmin: createAuthGuard({
    requireAuth: true,
    requireRole: ['super_admin', 'system_owner'],
  }),

  requireSystemOwner: createAuthGuard({
    requireAuth: true,
    requireRole: 'system_owner',
  }),

  requirePermission: (permission: string) =>
    createAuthGuard({
      requireAuth: true,
      requirePermission: permission,
    }),

  requireAnyPermission: (permissions: string[]) =>
    createAuthGuard({
      requireAuth: true,
      requirePermission: permissions,
    }),
};
