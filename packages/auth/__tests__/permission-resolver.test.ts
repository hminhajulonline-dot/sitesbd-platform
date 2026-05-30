// ============================================
// Permission Resolver Tests
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionResolver } from '../src/permissions/permission-resolver';
import type { SupabaseClient } from '@supabase/supabase-js';

const createMockSupabase = () => {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
};

describe('PermissionResolver', () => {
  let permResolver: PermissionResolver;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    permResolver = new PermissionResolver({ supabase: mockSupabase as unknown as SupabaseClient });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions successfully', async () => {
      // Mock user roles
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }, { role_id: 'role-2' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [
                    { permissions: { name: 'view_users' } },
                    { permissions: { name: 'manage_domains' } },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const result = await permResolver.getUserPermissions('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toContain('view_users');
      expect(result.data).toContain('manage_domains');
    });

    it('should return empty array for user with no roles', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }));

      const result = await permResolver.getUserPermissions('user-with-no-roles');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should deduplicate permissions', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [
                    { permissions: { name: 'view_users' } },
                    { permissions: { name: 'view_users' } }, // duplicate
                    { permissions: { name: 'manage_domains' } },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const result = await permResolver.getUserPermissions('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ permissions: { name: 'manage_users' } }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasPermission = await permResolver.hasPermission('user-1', 'manage_users');

      expect(hasPermission).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ permissions: { name: 'view_users' } }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasPermission = await permResolver.hasPermission('user-1', 'manage_users');

      expect(hasPermission).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has any of the permissions', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ permissions: { name: 'view_users' } }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasAny = await permResolver.hasAnyPermission('user-1', ['manage_users', 'view_users']);

      expect(hasAny).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ permissions: { name: 'view_dns_records' } }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasAny = await permResolver.hasAnyPermission('user-1', ['manage_users', 'view_users']);

      expect(hasAny).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [
                    { permissions: { name: 'view_users' } },
                    { permissions: { name: 'manage_users' } },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasAll = await permResolver.hasAllPermissions('user-1', ['view_users', 'manage_users']);

      expect(hasAll).toBe(true);
    });

    it('should return false when user is missing any permission', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ role_id: 'role-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'role_permissions') {
          return {
            select: () => ({
              in: () => ({
                single: vi.fn().mockResolvedValue({
                  data: [{ permissions: { name: 'view_users' } }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const hasAll = await permResolver.hasAllPermissions('user-1', ['view_users', 'manage_users']);

      expect(hasAll).toBe(false);
    });
  });

  describe('PERMISSIONS constant', () => {
    it('should have all expected permission constants', () => {
      expect(PermissionResolver.PERMISSIONS.MANAGE_USERS).toBe('manage_users');
      expect(PermissionResolver.PERMISSIONS.VIEW_DOMAINS).toBe('view_domains');
      expect(PermissionResolver.PERMISSIONS.MANAGE_DNS).toBe('manage_dns');
      expect(PermissionResolver.PERMISSIONS.MANAGE_BILLING).toBe('manage_billing');
      expect(PermissionResolver.PERMISSIONS.MANAGE_CMS).toBe('manage_cms');
    });
  });
});
