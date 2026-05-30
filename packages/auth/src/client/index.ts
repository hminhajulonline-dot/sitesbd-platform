// ============================================
// Supabase Auth Client
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser, AuthSession, AuthResult } from '../types';

export interface AuthClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string;
}

export class AuthClient {
  private supabase: SupabaseClient;
  private serviceSupabase: SupabaseClient | null = null;

  constructor(config: AuthClientConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    
    if (config.supabaseServiceKey) {
      this.serviceSupabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get serviceClient(): SupabaseClient | null {
    return this.serviceSupabase;
  }

  // ============================================
  // User Management
  // ============================================

  async getUser(): Promise<AuthResult<AuthUser>> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        return { success: false, error: { code: 'GET_USER_ERROR', message: error.message } };
      }
      
      if (!user) {
        return { success: false, error: { code: 'NO_USER', message: 'No authenticated user' } };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        emailVerified: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
        lastSignInAt: user.last_sign_in_at || null,
        metadata: {
          fullName: user.user_metadata?.full_name,
          phone: user.user_metadata?.phone,
          avatarUrl: user.user_metadata?.avatar_url,
        },
      };

      return { success: true, data: authUser };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'UNKNOWN_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  async getSession(): Promise<AuthResult<AuthSession>> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        return { success: false, error: { code: 'GET_SESSION_ERROR', message: error.message } };
      }
      
      if (!session) {
        return { success: false, error: { code: 'NO_SESSION', message: 'No active session' } };
      }

      const authSession: AuthSession = {
        id: session.access_token.substring(0, 32),
        userId: session.user.id,
        sessionToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: new Date((session.expires_at || 0) * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        ipAddress: null,
        userAgent: null,
        deviceId: null,
        isActive: true,
      };

      return { success: true, data: authSession };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'UNKNOWN_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: { code: 'SIGN_OUT_ERROR', message: error.message } };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'UNKNOWN_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let authClientInstance: AuthClient | null = null;

export function initAuthClient(config: AuthClientConfig): AuthClient {
  authClientInstance = new AuthClient(config);
  return authClientInstance;
}

export function getAuthClient(): AuthClient {
  if (!authClientInstance) {
    throw new Error('AuthClient not initialized. Call initAuthClient first.');
  }
  return authClientInstance;
}

export { AuthClient as default };
