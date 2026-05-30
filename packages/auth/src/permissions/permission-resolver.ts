// ============================================
// Permission Resolver
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthPermission, AuthResult } from '../types';

export interface PermissionResolverConfig {
  supabase: SupabaseClient;
}

export class PermissionResolver {
  private supabase: SupabaseClient;
  private permissionCache: Map<string, { permissions: string[]; expires: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(config: PermissionResolverConfig) {
    this.supabase = config.supabase;
  }

  async getUserPermissions(userId: string, useCache = true): Promise<AuthResult<string[]>> {
    try {
      if (useCache) {
        const cached = this.permissionCache.get(userId);
        if (cached && cached.expires > Date.now()) {
          return { success: true, data: cached.permissions };
        }
      }

      // Get user's roles
      const { data: userRoles, error: rolesError } = await this.supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId);

      if (rolesError) {
        return { success: false, error: { code: 'FETCH_ROLES_ERROR', message: rolesError.message } };
      }

      if (!userRoles || userRoles.length === 0) {
        return { success: true, data: [] };
      }

      const roleIds = userRoles.map((ur) => ur.role_id);

      // Get permissions for all roles
      const { data: rolePermissions, error: permError } = await this.supabase
        .from('role_permissions')
        .select('permissions(name)')
        .in('role_id', roleIds);

      if (permError) {
        return { success: false, error: { code: 'FETCH_PERMISSIONS_ERROR', message: permError.message } };
      }

      // Extract unique permission names
      const permissionsSet = new Set<string>();
      for (const rp of rolePermissions || []) {
        const perm = rp.permissions as unknown as AuthPermission;
        if (perm && perm.name) {
          permissionsSet.add(perm.name);
        }
      }

      const permissions = Array.from(permissionsSet);
      this.permissionCache.set(userId, { permissions, expires: Date.now() + this.cacheTimeout });

      return { success: true, data: permissions };
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

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const result = await this.getUserPermissions(userId);
    if (!result.success || !result.data) {
      return false;
    }
    return result.data.includes(permission);
  }

  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const perm of permissions) {
      if (await this.hasPermission(userId, perm)) {
        return true;
      }
    }
    return false;
  }

  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    for (const perm of permissions) {
      if (!(await this.hasPermission(userId, perm))) {
        return false;
      }
    }
    return true;
  }

  // ============================================
  // Predefined Permission Groups
  // ============================================

  static readonly PERMISSIONS = {
    // User management
    MANAGE_USERS: 'manage_users',
    VIEW_USERS: 'view_users',
    CREATE_USERS: 'create_users',
    UPDATE_USERS: 'update_users',
    DELETE_USERS: 'delete_users',
    SUSPEND_USERS: 'suspend_users',

    // Domain management
    MANAGE_DOMAINS: 'manage_domains',
    VIEW_DOMAINS: 'view_domains',
    CREATE_DOMAINS: 'create_domains',
    UPDATE_DOMAINS: 'update_domains',
    DELETE_DOMAINS: 'delete_domains',
    TRANSFER_DOMAINS: 'transfer_domains',

    // DNS management
    MANAGE_DNS: 'manage_dns',
    VIEW_DNS_RECORDS: 'view_dns_records',
    CREATE_DNS_RECORDS: 'create_dns_records',
    UPDATE_DNS_RECORDS: 'update_dns_records',
    DELETE_DNS_RECORDS: 'delete_dns_records',

    // Billing
    MANAGE_BILLING: 'manage_billing',
    VIEW_INVOICES: 'view_invoices',
    CREATE_INVOICES: 'create_invoices',
    UPDATE_INVOICES: 'update_invoices',
    DELETE_INVOICES: 'delete_invoices',
    PROCESS_PAYMENTS: 'process_payments',
    REFUND_PAYMENTS: 'refund_payments',

    // Support
    MANAGE_SUPPORT: 'manage_support',
    VIEW_TICKETS: 'view_tickets',
    CREATE_TICKETS: 'create_tickets',
    UPDATE_TICKETS: 'update_tickets',
    DELETE_TICKETS: 'delete_tickets',
    ASSIGN_TICKETS: 'assign_tickets',

    // CMS
    MANAGE_CMS: 'manage_cms',
    VIEW_CMS_PAGES: 'view_cms_pages',
    CREATE_CMS_PAGES: 'create_cms_pages',
    UPDATE_CMS_PAGES: 'update_cms_pages',
    DELETE_CMS_PAGES: 'delete_cms_pages',
    PUBLISH_CMS_PAGES: 'publish_cms_pages',

    // Settings
    MANAGE_SETTINGS: 'manage_settings',
    VIEW_SETTINGS: 'view_settings',
    UPDATE_SETTINGS: 'update_settings',
    MANAGE_FEATURE_FLAGS: 'manage_feature_flags',

    // Cloudflare
    MANAGE_CLOUDFLARE: 'manage_cloudflare',
    VIEW_CLOUDFLARE_ZONES: 'view_cloudflare_zones',
    CREATE_CLOUDFLARE_ZONES: 'create_cloudflare_zones',
    UPDATE_CLOUDFLARE_ZONES: 'update_cloudflare_zones',
    DELETE_CLOUDFLARE_ZONES: 'delete_cloudflare_zones',
    SYNC_DNS_RECORDS: 'sync_dns_records',

    // Audit
    MANAGE_AUDIT: 'manage_audit',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    EXPORT_AUDIT_LOGS: 'export_audit_logs',
  } as const;

  clearCache(userId?: string): void {
    if (userId) {
      this.permissionCache.delete(userId);
    } else {
      this.permissionCache.clear();
    }
  }
}
