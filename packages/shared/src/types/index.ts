export type Environment = 'development' | 'staging' | 'production';

export interface AppInfo {
  name: string;
  version: string;
  environment: Environment;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  app: string;
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
