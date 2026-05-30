// ============================================
// Auth Guards
// ============================================

import type { AuthContext, RoleType } from '../types';

/**
 * Require authentication guard
 */
export function requireAuth() {
  return (context: AuthContext): { allowed: boolean; error?: string } => {
    if (!context.isAuthenticated) {
      return { allowed: false, error: 'Authentication required' };
    }
    return { allowed: true };
  };
}

/**
 * Require specific role(s) guard
 */
export function requireRole(role: RoleType | RoleType[]) {
  const requiredRoles = Array.isArray(role) ? role : [role];
  
  return (context: AuthContext): { allowed: boolean; error?: string } => {
    if (!context.isAuthenticated) {
      return { allowed: false, error: 'Authentication required' };
    }

    const hasRequiredRole = context.roles.some((r) =>
      requiredRoles.includes(r.roleType)
    );

    if (!hasRequiredRole) {
      return { allowed: false, error: `Required role: ${requiredRoles.join(' or ')}` };
    }

    return { allowed: true };
  };
}

/**
 * Require specific permission(s) guard
 */
export function requirePermission(permission: string | string[]) {
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  
  return (context: AuthContext): { allowed: boolean; error?: string } => {
    if (!context.isAuthenticated) {
      return { allowed: false, error: 'Authentication required' };
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      context.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return { allowed: false, error: `Required permission: ${requiredPermissions.join(', ')}` };
    }

    return { allowed: true };
  };
}

/**
 * Compose multiple guards
 */
export function composeGuards(...guardFns: Array<(context: AuthContext) => { allowed: boolean; error?: string }>) {
  return (context: AuthContext): { allowed: boolean; error?: string } => {
    for (const guardFn of guardFns) {
      const result = guardFn(context);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  };
}

// Pre-configured guard factories
export const guardFactories = {
  /**
   * Admin guard - requires admin, super_admin, or system_owner role
   */
  admin: () => requireRole(['admin', 'super_admin', 'system_owner']),

  /**
   * Super admin guard - requires super_admin or system_owner role
   */
  superAdmin: () => requireRole(['super_admin', 'system_owner']),

  /**
   * System owner guard - requires system_owner role only
   */
  systemOwner: () => requireRole('system_owner'),

  /**
   * Billing manager guard - requires billing_manager role
   */
  billingManager: () => requireRole(['billing_manager', 'super_admin', 'system_owner']),

  /**
   * Support agent guard - requires support_agent role
   */
  supportAgent: () => requireRole(['support_agent', 'super_admin', 'system_owner']),

  /**
   * User guard - requires any authenticated user
   */
  user: () => requireAuth(),
};
