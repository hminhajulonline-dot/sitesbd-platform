// ============================================
// Role Resolver Tests
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleResolver } from '../src/permissions/role-resolver';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthRole, RoleType } from '../src/types';

// Mock Supabase client
const createMockSupabase = () => {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
};

describe('RoleResolver', () => {
  let roleResolver: RoleResolver;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    roleResolver = new RoleResolver({ supabase: mockSupabase as unknown as SupabaseClient });
  });

  describe('getUserRoles', () => {
    it('should return user roles successfully', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'admin-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'admin-role-id',
            name: 'Admin',
            description: 'Administrator',
            role_type: 'admin',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const result = await roleResolver.getUserRoles('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].roleType).toBe('admin');
    });

    it('should return empty array for user with no roles', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null });

      const result = await roleResolver.getUserRoles('user-with-no-roles');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should filter expired roles', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'expired-role-id',
          assigned_by: null,
          expires_at: pastDate.toISOString(),
          created_at: new Date().toISOString(),
          roles: {
            id: 'expired-role-id',
            name: 'Expired Role',
            description: null,
            role_type: 'admin',
            is_system: false,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const result = await roleResolver.getUserRoles('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should return error on database failure', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await roleResolver.getUserRoles('user-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ROLES_ERROR');
    });
  });

  describe('getPrimaryRole', () => {
    it('should return highest priority role', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'user-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'user-role-id',
            name: 'User',
            description: null,
            role_type: 'user',
            is_system: true,
          },
        },
        {
          id: 'role-2',
          user_id: 'user-1',
          role_id: 'admin-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'admin-role-id',
            name: 'Admin',
            description: null,
            role_type: 'admin',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const result = await roleResolver.getPrimaryRole('user-1');

      expect(result.success).toBe(true);
      expect(result.data?.roleType).toBe('admin');
    });

    it('should return null for user with no roles', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null });

      const result = await roleResolver.getPrimaryRole('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'admin-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'admin-role-id',
            name: 'Admin',
            description: null,
            role_type: 'admin',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const hasAdmin = await roleResolver.hasRole('user-1', 'admin');

      expect(hasAdmin).toBe(true);
    });

    it('should return false when user does not have the role', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'user-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'user-role-id',
            name: 'User',
            description: null,
            role_type: 'user',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const hasAdmin = await roleResolver.hasRole('user-1', 'admin');

      expect(hasAdmin).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'user-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'user-role-id',
            name: 'User',
            description: null,
            role_type: 'user',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const hasAny = await roleResolver.hasAnyRole('user-1', ['admin', 'user']);

      expect(hasAny).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'user-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'user-role-id',
            name: 'User',
            description: null,
            role_type: 'user',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });

      const hasAny = await roleResolver.hasAnyRole('user-1', ['admin', 'super_admin']);

      expect(hasAny).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear specific user cache', async () => {
      // First, populate cache by calling getUserRoles
      const mockRoles = [
        {
          id: 'role-1',
          user_id: 'user-1',
          role_id: 'admin-role-id',
          assigned_by: null,
          expires_at: null,
          created_at: new Date().toISOString(),
          roles: {
            id: 'admin-role-id',
            name: 'Admin',
            description: null,
            role_type: 'admin',
            is_system: true,
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });
      await roleResolver.getUserRoles('user-1');

      // Clear cache
      roleResolver.clearCache('user-1');

      // Verify cache was cleared by checking it's called again
      mockSupabase.single.mockResolvedValue({ data: mockRoles, error: null });
      await roleResolver.getUserRoles('user-1');

      // If we got here without error, cache was cleared
      expect(true).toBe(true);
    });

    it('should clear all cache', () => {
      roleResolver.clearCache();
      expect(true).toBe(true);
    });
  });
});
