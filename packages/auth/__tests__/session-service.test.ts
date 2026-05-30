// ============================================
// Session Service Tests
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../src/session/session-service';
import type { SupabaseClient } from '@supabase/supabase-js';

const createMockSupabase = () => {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
};

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    sessionService = new SessionService({ supabase: mockSupabase as unknown as SupabaseClient });
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        session_token: 'token-123',
        refresh_token: 'refresh-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        device_id: 'device-1',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({ data: mockSession, error: null });

      const result = await sessionService.createSession({
        userId: 'user-1',
        sessionToken: 'token-123',
        refreshToken: 'refresh-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        deviceId: 'device-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('session-1');
      expect(result.data?.userId).toBe('user-1');
      expect(result.data?.sessionToken).toBe('token-123');
    });

    it('should return error on database failure', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await sessionService.createSession({
        userId: 'user-1',
        sessionToken: 'token-123',
        refreshToken: 'refresh-123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREATE_SESSION_ERROR');
    });
  });

  describe('getSession', () => {
    it('should return session when valid', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        session_token: 'token-123',
        refresh_token: 'refresh-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        device_id: 'device-1',
        expires_at: futureDate.toISOString(),
        last_activity_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({ data: mockSession, error: null });

      const result = await sessionService.getSession('token-123');

      expect(result.success).toBe(true);
      expect(result.data?.sessionToken).toBe('token-123');
    });

    it('should return error when session expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        session_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: pastDate.toISOString(),
        last_activity_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({ data: mockSession, error: null });

      const result = await sessionService.getSession('token-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SESSION_EXPIRED');
    });

    it('should return error when session not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Session not found' },
      });

      const result = await sessionService.getSession('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GET_SESSION_ERROR');
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions for user', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          session_token: 'token-1',
          refresh_token: 'refresh-1',
          expires_at: futureDate.toISOString(),
          last_activity_at: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'session-2',
          user_id: 'user-1',
          session_token: 'token-2',
          refresh_token: 'refresh-2',
          expires_at: futureDate.toISOString(),
          last_activity_at: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.order.mockResolvedValue({ data: mockSessions, error: null });

      const result = await sessionService.getActiveSessions('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should return empty array when no active sessions', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await sessionService.getActiveSessions('user-with-no-sessions');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('updateLastActivity', () => {
    it('should update last activity successfully', async () => {
      mockSupabase.update.mockResolvedValue({ data: null, error: null });

      const result = await sessionService.updateLastActivity({
        sessionId: 'session-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
    });

    it('should return error on database failure', async () => {
      mockSupabase.update.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await sessionService.updateLastActivity({
        sessionId: 'session-1',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPDATE_ACTIVITY_ERROR');
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate session successfully', async () => {
      mockSupabase.update.mockResolvedValue({ data: null, error: null });

      const result = await sessionService.invalidateSession('session-1');

      expect(result.success).toBe(true);
    });

    it('should return error on database failure', async () => {
      mockSupabase.update.mockResolvedValue({
        data: null,
        error: { message: 'Invalidate failed' },
      });

      const result = await sessionService.invalidateSession('session-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALIDATE_SESSION_ERROR');
    });
  });

  describe('invalidateAllUserSessions', () => {
    it('should invalidate all user sessions', async () => {
      mockSupabase.update.mockResolvedValue({ data: null, error: null, count: 3 });

      const result = await sessionService.invalidateAllUserSessions('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should invalidate all except current session', async () => {
      mockSupabase.neq.mockReturnThis();
      mockSupabase.update.mockResolvedValue({ data: null, error: null, count: 2 });

      const result = await sessionService.invalidateAllUserSessions('user-1', 'session-current');

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      mockSupabase.update.mockResolvedValue({ data: null, error: null, count: 5 });

      const result = await sessionService.cleanupExpiredSessions();

      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
    });
  });
});
