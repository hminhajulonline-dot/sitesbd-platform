// ============================================
// Auth Types for SitesBD Platform
// ============================================

// Role types matching database enums
export type RoleType = 'system_owner' | 'super_admin' | 'admin' | 'billing_manager' | 'support_agent' | 'user';

// ============================================
// Auth User
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastSignInAt: string | null;
  metadata: AuthUserMetadata;
}

export interface AuthUserMetadata {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

// ============================================
// Auth Session
// ============================================

export interface AuthSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  isActive: boolean;
}

// ============================================
// Auth Role
// ============================================

export interface AuthRole {
  id: string;
  name: string;
  roleType: RoleType;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: AuthRole;
  assignedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ============================================
// Auth Permission
// ============================================

export interface AuthPermission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

// ============================================
// Device Types
// ============================================

export interface UserDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  firstSeenAt: string;
  isTrusted: boolean;
  isCurrent: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  sessionToken: string;
  refreshToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  inApp: boolean;
  marketing: boolean;
}

// ============================================
// Route Protection Types
// ============================================

export type RouteProtectionLevel = 'public' | 'authenticated' | 'user' | 'admin' | 'super_admin';

export interface RouteConfig {
  path: string;
  protection: RouteProtectionLevel;
  roles?: RoleType[];
  permissions?: string[];
}

export interface AuthContext {
  user: AuthUser | null;
  session: AuthSession | null;
  roles: AuthRole[];
  permissions: string[];
  isAuthenticated: boolean;
}

// ============================================
// Auth Result Types
// ============================================

export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// OTP Types (Future)
// ============================================

export interface OTPConfig {
  enabled: boolean;
  methods: ('email' | 'sms' | 'totp')[];
  codeLength: number;
  expirySeconds: number;
  maxAttempts: number;
}

export interface OTPVerification {
  method: 'email' | 'sms' | 'totp';
  verified: boolean;
  verifiedAt: string | null;
}
