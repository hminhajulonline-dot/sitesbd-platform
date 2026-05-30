export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SitesBD Platform';
export const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';
export const APP_VERSION = '0.1.0';

export const API_ROUTES = {
  HEALTH: '/health',
  API_V1: '/api/v1',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
