// ============================================
// SitesBD Auth Package
// ============================================

// Types
export * from './types';

// Client
export { AuthClient, initAuthClient, getAuthClient } from './client';

// Server
export { AuthServerClient, initAuthServer, getAuthServer } from './server';

// Permissions
export { RoleResolver } from './permissions/role-resolver';
export { PermissionResolver } from './permissions/permission-resolver';

// Session
export { SessionService } from './session/session-service';

// Devices
export { DeviceService } from './devices/device-service';

// Middleware
export { AuthMiddleware, createAuthGuard, guards } from './middleware/auth-middleware';
export { requireAuth, requireRole, requirePermission, composeGuards, guardFactories } from './middleware/guards';
