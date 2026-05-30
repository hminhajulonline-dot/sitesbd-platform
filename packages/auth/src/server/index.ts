// ============================================
// Supabase Auth Server Client
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser, AuthResult } from '../types';

export interface AuthServerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export class AuthServerClient {
  private supabase: SupabaseClient;

  constructor(config: AuthServerConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async getUserById(userId: string): Promise<AuthResult<AuthUser>> {
    try {
      const { data: { user }, error } = await this.supabase.auth.admin.getUserById(userId);
      
      if (error) {
        return { success: false, error: { code: 'GET_USER_ERROR', message: error.message } };
      }
      
      if (!user) {
        return { success: false, error: { code: 'NO_USER', message: 'User not found' } };
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

  async listUsers(limit = 100, page = 0): Promise<AuthResult<AuthUser[]>> {
    try {
      const { data, error } = await this.supabase.auth.admin.listUsers();
      
      if (error) {
        return { success: false, error: { code: 'LIST_USERS_ERROR', message: error.message } };
      }

      const users: AuthUser[] = (data.users || []).slice(page * limit, (page + 1) * limit).map((user) => ({
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
      }));

      return { success: true, data: users };
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

  async createUser(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult<AuthUser>> {
    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      
      if (error) {
        return { success: false, error: { code: 'CREATE_USER_ERROR', message: error.message } };
      }

      if (!data.user) {
        return { success: false, error: { code: 'CREATE_USER_ERROR', message: 'Failed to create user' } };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        emailVerified: data.user.email_confirmed_at !== null,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
        lastSignInAt: data.user.last_sign_in_at || null,
        metadata: {
          fullName: data.user.user_metadata?.full_name,
          phone: data.user.user_metadata?.phone,
          avatarUrl: data.user.user_metadata?.avatar_url,
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

  async updateUser(userId: string, attributes: Record<string, unknown>): Promise<AuthResult<AuthUser>> {
    try {
      const { data, error } = await this.supabase.auth.admin.updateUserById(userId, attributes);
      
      if (error) {
        return { success: false, error: { code: 'UPDATE_USER_ERROR', message: error.message } };
      }

      if (!data.user) {
        return { success: false, error: { code: 'UPDATE_USER_ERROR', message: 'Failed to update user' } };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        emailVerified: data.user.email_confirmed_at !== null,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
        lastSignInAt: data.user.last_sign_in_at || null,
        metadata: {
          fullName: data.user.user_metadata?.full_name,
          phone: data.user.user_metadata?.phone,
          avatarUrl: data.user.user_metadata?.avatar_url,
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

  async deleteUser(userId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        return { success: false, error: { code: 'DELETE_USER_ERROR', message: error.message } };
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

  async generateLink(type: 'invite' | 'magiclink' | 'recovery', email: string): Promise<AuthResult<string>> {
    try {
      const { data, error } = await this.supabase.auth.admin.generateLink({ type, email });
      
      if (error) {
        return { success: false, error: { code: 'GENERATE_LINK_ERROR', message: error.message } };
      }

      return { success: true, data: data.properties.action_link };
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

let authServerInstance: AuthServerClient | null = null;

export function initAuthServer(config: AuthServerConfig): AuthServerClient {
  authServerInstance = new AuthServerClient(config);
  return authServerInstance;
}

export function getAuthServer(): AuthServerClient {
  if (!authServerInstance) {
    throw new Error('AuthServerClient not initialized. Call initAuthServer first.');
  }
  return authServerInstance;
}

export { AuthServerClient as default };
