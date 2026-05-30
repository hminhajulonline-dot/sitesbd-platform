// ============================================
// Role Resolver
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthRole, UserRole, RoleType, AuthResult } from '../types';

export interface RoleResolverConfig {
  supabase: SupabaseClient;
}

export class RoleResolver {
  private supabase: SupabaseClient;
  private roleCache: Map<string, { roles: AuthRole[]; expires: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(config: RoleResolverConfig) {
    this.supabase = config.supabase;
  }

  async getUserRoles(userId: string, useCache = true): Promise<AuthResult<AuthRole[]>> {
    try {
      if (useCache) {
        const cached = this.roleCache.get(userId);
        if (cached && cached.expires > Date.now()) {
          return { success: true, data: cached.roles };
        }
      }

      const { data: userRoles, error } = await this.supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_id,
          assigned_by,
          expires_at,
          created_at,
          roles (
            id,
            name,
            description,
            role_type,
            is_system
          )
        `)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: { code: 'FETCH_ROLES_ERROR', message: error.message } };
      }

      const roles: AuthRole[] = [];
      for (const ur of userRoles || []) {
        const role = ur.roles as unknown as AuthRole;
        if (role) {
          if (ur.expires_at && new Date(ur.expires_at) < new Date()) {
            continue;
          }
          roles.push({
            id: role.id,
            name: role.name,
            roleType: role.role_type as RoleType,
            description: role.description,
            isSystem: role.is_system,
            permissions: [],
          });
        }
      }

      this.roleCache.set(userId, { roles, expires: Date.now() + this.cacheTimeout });
      return { success: true, data: roles };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getPrimaryRole(userId: string): Promise<AuthResult<AuthRole | null>> {
    const result = await this.getUserRoles(userId);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const rolePriority: RoleType[] = [
      'system_owner',
      'super_admin',
      'admin',
      'billing_manager',
      'support_agent',
      'user',
    ];

    for (const roleType of rolePriority) {
      const role = result.data.find((r) => r.roleType === roleType);
      if (role) {
        return { success: true, data: role };
      }
    }

    return { success: true, data: null };
  }

  async hasRole(userId: string, roleType: RoleType): Promise<boolean> {
    const result = await this.getUserRoles(userId);
    if (!result.success || !result.data) {
      return false;
    }
    return result.data.some((role) => role.roleType === roleType);
  }

  async hasAnyRole(userId: string, roleTypes: RoleType[]): Promise<boolean> {
    for (const roleType of roleTypes) {
      if (await this.hasRole(userId, roleType)) {
        return true;
      }
    }
    return false;
  }

  async hasAllRoles(userId: string, roleTypes: RoleType[]): Promise<boolean> {
    for (const roleType of roleTypes) {
      if (!(await this.hasRole(userId, roleType))) {
        return false;
      }
    }
    return true;
  }

  async assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: string): Promise<AuthResult<UserRole>> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'ASSIGN_ROLE_ERROR', message: error.message } };
      }

      this.roleCache.delete(userId);
      return { success: true, data: data as unknown as UserRole };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async revokeRole(userId: string, roleId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        return { success: false, error: { code: 'REVOKE_ROLE_ERROR', message: error.message } };
      }

      this.roleCache.delete(userId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.roleCache.delete(userId);
    } else {
      this.roleCache.clear();
    }
  }
}
