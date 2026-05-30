// ============================================
// Session Service
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthSession, AuthResult } from '../types';

export interface SessionServiceConfig {
  supabase: SupabaseClient;
}

export interface CreateSessionParams {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  expiresIn?: number; // seconds, default 7 days
}

export interface UpdateActivityParams {
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionService {
  private supabase: SupabaseClient;
  private defaultExpiry = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(config: SessionServiceConfig) {
    this.supabase = config.supabase;
  }

  async createSession(params: CreateSessionParams): Promise<AuthResult<AuthSession>> {
    try {
      const expiresAt = new Date(Date.now() + (params.expiresIn || this.defaultExpiry) * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert({
          user_id: params.userId,
          session_token: params.sessionToken,
          refresh_token: params.refreshToken,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
          device_id: params.deviceId,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'CREATE_SESSION_ERROR', message: error.message } };
      }

      const session: AuthSession = {
        id: data.id,
        userId: data.user_id,
        sessionToken: data.session_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        lastActivityAt: data.last_activity_at,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        deviceId: data.device_id,
        isActive: data.is_active,
      };

      return { success: true, data: session };
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

  async getSession(sessionToken: string): Promise<AuthResult<AuthSession>> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: { code: 'GET_SESSION_ERROR', message: error.message } };
      }

      // Check if session is expired
      if (new Date(data.expires_at) < new Date()) {
        return { success: false, error: { code: 'SESSION_EXPIRED', message: 'Session has expired' } };
      }

      const session: AuthSession = {
        id: data.id,
        userId: data.user_id,
        sessionToken: data.session_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        lastActivityAt: data.last_activity_at,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        deviceId: data.device_id,
        isActive: data.is_active,
      };

      return { success: true, data: session };
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

  async getActiveSessions(userId: string): Promise<AuthResult<AuthSession[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity_at', { ascending: false });

      if (error) {
        return { success: false, error: { code: 'GET_SESSIONS_ERROR', message: error.message } };
      }

      const sessions: AuthSession[] = (data || []).map((s) => ({
        id: s.id,
        userId: s.user_id,
        sessionToken: s.session_token,
        refreshToken: s.refresh_token,
        expiresAt: s.expires_at,
        createdAt: s.created_at,
        lastActivityAt: s.last_activity_at,
        ipAddress: s.ip_address,
        userAgent: s.user_agent,
        deviceId: s.device_id,
        isActive: s.is_active,
      }));

      return { success: true, data: sessions };
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

  async updateLastActivity(params: UpdateActivityParams): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        })
        .eq('id', params.sessionId);

      if (error) {
        return { success: false, error: { code: 'UPDATE_ACTIVITY_ERROR', message: error.message } };
      }

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

  async invalidateSession(sessionId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) {
        return { success: false, error: { code: 'INVALIDATE_SESSION_ERROR', message: error.message } };
      }

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

  async invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<AuthResult<number>> {
    try {
      let query = this.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId);
      }

      const { error, count } = await query;

      if (error) {
        return { success: false, error: { code: 'INVALIDATE_ALL_ERROR', message: error.message } };
      }

      return { success: true, data: count || 0 };
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

  async cleanupExpiredSessions(): Promise<AuthResult<number>> {
    try {
      const { error, count } = await this.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true);

      if (error) {
        return { success: false, error: { code: 'CLEANUP_ERROR', message: error.message } };
      }

      return { success: true, data: count || 0 };
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
}
