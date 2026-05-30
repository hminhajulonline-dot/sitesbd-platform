// ============================================
// Device Service
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserDevice, UserPreferences, AuthResult, NotificationPreferences } from '../types';

export interface DeviceServiceConfig {
  supabase: SupabaseClient;
}

export interface RegisterDeviceParams {
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  ipAddress?: string;
}

export interface UpdateDeviceParams {
  deviceId: string;
  isTrusted?: boolean;
  lastActiveAt?: string;
}

export class DeviceService {
  private supabase: SupabaseClient;

  constructor(config: DeviceServiceConfig) {
    this.supabase = config.supabase;
  }

  // ============================================
  // Device Management
  // ============================================

  async registerDevice(params: RegisterDeviceParams): Promise<AuthResult<UserDevice>> {
    try {
      // Check if device already exists
      const { data: existing } = await this.supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', params.userId)
        .eq('device_id', params.deviceId)
        .single();

      if (existing) {
        // Update last active
        const { data, error } = await this.supabase
          .from('user_devices')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          return { success: false, error: { code: 'UPDATE_DEVICE_ERROR', message: error.message } };
        }

        return { success: true, data: this.mapToUserDevice(data, params.userId) };
      }

      // Create new device
      const { data, error } = await this.supabase
        .from('user_devices')
        .insert({
          user_id: params.userId,
          device_id: params.deviceId,
          device_name: params.deviceName,
          device_type: params.deviceType,
          browser: params.browser,
          os: params.os,
          ip_address: params.ipAddress,
          is_trusted: false,
          is_current: true,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'REGISTER_DEVICE_ERROR', message: error.message } };
      }

      return { success: true, data: this.mapToUserDevice(data, params.userId) };
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

  async getUserDevices(userId: string): Promise<AuthResult<UserDevice[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (error) {
        return { success: false, error: { code: 'GET_DEVICES_ERROR', message: error.message } };
      }

      const devices: UserDevice[] = (data || []).map((d) => this.mapToUserDevice(d, userId));
      return { success: true, data: devices };
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

  async updateDevice(deviceId: string, params: UpdateDeviceParams): Promise<AuthResult<UserDevice>> {
    try {
      const updates: Record<string, unknown> = {};
      if (params.isTrusted !== undefined) updates.is_trusted = params.isTrusted;
      if (params.lastActiveAt) updates.last_active_at = params.lastActiveAt;

      const { data, error } = await this.supabase
        .from('user_devices')
        .update(updates)
        .eq('device_id', deviceId)
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'UPDATE_DEVICE_ERROR', message: error.message } };
      }

      return { success: true, data: this.mapToUserDevice(data, data.user_id) };
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

  async trustDevice(deviceId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_devices')
        .update({ is_trusted: true })
        .eq('device_id', deviceId);

      if (error) {
        return { success: false, error: { code: 'TRUST_DEVICE_ERROR', message: error.message } };
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

  async untrustDevice(deviceId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_devices')
        .update({ is_trusted: false })
        .eq('device_id', deviceId);

      if (error) {
        return { success: false, error: { code: 'UNTRUST_DEVICE_ERROR', message: error.message } };
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

  async removeDevice(deviceId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_devices')
        .delete()
        .eq('device_id', deviceId);

      if (error) {
        return { success: false, error: { code: 'REMOVE_DEVICE_ERROR', message: error.message } };
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

  // ============================================
  // User Preferences
  // ============================================

  async getPreferences(userId: string): Promise<AuthResult<UserPreferences>> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: { code: 'GET_PREFERENCES_ERROR', message: error.message } };
      }

      if (data) {
        return { success: true, data: this.mapToUserPreferences(data) };
      }

      // Create default preferences
      return this.createDefaultPreferences(userId);
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

  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<AuthResult<UserPreferences>> {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.theme) dbUpdates.theme = updates.theme;
      if (updates.language) dbUpdates.language = updates.language;
      if (updates.timezone) dbUpdates.timezone = updates.timezone;
      if (updates.notifications) {
        dbUpdates.notification_email = updates.notifications.email;
        dbUpdates.notification_whatsapp = updates.notifications.whatsapp;
        dbUpdates.notification_in_app = updates.notifications.inApp;
        dbUpdates.notification_marketing = updates.notifications.marketing;
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'UPDATE_PREFERENCES_ERROR', message: error.message } };
      }

      return { success: true, data: this.mapToUserPreferences(data) };
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

  private async createDefaultPreferences(userId: string): Promise<AuthResult<UserPreferences>> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          notification_email: true,
          notification_whatsapp: true,
          notification_in_app: true,
          notification_marketing: false,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'CREATE_PREFERENCES_ERROR', message: error.message } };
      }

      return { success: true, data: this.mapToUserPreferences(data) };
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

  // ============================================
  // Helpers
  // ============================================

  private mapToUserDevice(data: Record<string, unknown>, userId: string): UserDevice {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      deviceId: data.device_id as string,
      deviceName: data.device_name as string,
      deviceType: data.device_type as 'desktop' | 'mobile' | 'tablet' | 'unknown',
      browser: data.browser as string | null,
      os: data.os as string | null,
      ipAddress: data.ip_address as string | null,
      lastActiveAt: data.last_active_at as string,
      firstSeenAt: data.created_at as string,
      isTrusted: data.is_trusted as boolean,
      isCurrent: data.is_current as boolean,
    };
  }

  private mapToUserPreferences(data: Record<string, unknown>): UserPreferences {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      theme: data.theme as 'light' | 'dark' | 'system',
      language: data.language as string,
      timezone: data.timezone as string,
      notifications: {
        email: data.notification_email as boolean,
        whatsapp: data.notification_whatsapp as boolean,
        inApp: data.notification_in_app as boolean,
        marketing: data.notification_marketing as boolean,
      },
      updatedAt: data.updated_at as string,
    };
  }
}
