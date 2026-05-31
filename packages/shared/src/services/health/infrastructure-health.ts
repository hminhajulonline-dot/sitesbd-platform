// ============================================
// Infrastructure Health Service
// ============================================
// Provides health checks for Supabase, Database, Storage, and Environment

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  status: HealthStatus;
  latency?: number;
  error?: string;
  timestamp: string;
}

export interface InfrastructureHealth {
  overall: HealthStatus;
  database: ServiceHealth;
  auth: ServiceHealth;
  storage: ServiceHealth;
  environment: ServiceHealth;
  timestamp: string;
  version: string;
}

export interface EnvironmentVariable {
  name: string;
  required: boolean;
  value?: string;
  isSet: boolean;
  isValid?: boolean;
}

// Environment Variables Configuration
export const REQUIRED_ENV_VARS = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    pattern: /^https:\/\/.*\.supabase\.co$/,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    minLength: 100,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    minLength: 100,
  },
] as const;

export const OPTIONAL_ENV_VARS = [
  {
    name: 'CLOUDFLARE_API_TOKEN',
    required: false,
  },
  {
    name: 'CLOUDFLARE_ZONE_ID',
    required: false,
  },
  {
    name: 'SMTP_HOST',
    required: false,
  },
] as const;

// Supabase Storage Buckets Configuration
export const STORAGE_BUCKETS = [
  {
    name: 'avatars',
    description: 'User profile avatars',
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    name: 'cms-assets',
    description: 'CMS uploaded assets and media',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  },
  {
    name: 'documents',
    description: 'User and business documents',
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
] as const;

// ============================================
// Environment Validation
// ============================================

export function validateEnvironment(): EnvironmentVariable[] {
  const variables: EnvironmentVariable[] = [];

  for (const envVar of [...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS]) {
    const value = process.env[envVar.name];
    const isSet = value !== undefined && value !== '';

    let isValid = isSet;
    if (isSet && 'pattern' in envVar && envVar.pattern) {
      isValid = envVar.pattern.test(value);
    } else if (isSet && 'minLength' in envVar && envVar.minLength) {
      isValid = value.length >= envVar.minLength;
    }

    variables.push({
      name: envVar.name,
      required: envVar.required,
      value: isSet ? '[SET]' : undefined,
      isSet,
      isValid,
    });
  }

  return variables;
}

export function getEnvironmentHealth(): ServiceHealth {
  const variables = validateEnvironment();
  const missingRequired = variables.filter(v => v.required && !v.isSet);
  const invalidVars = variables.filter(v => v.isSet && v.isValid === false);

  const status: HealthStatus =
    missingRequired.length > 0 || invalidVars.length > 0
      ? 'unhealthy'
      : 'healthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    error:
      missingRequired.length > 0
        ? `Missing required variables: ${missingRequired.map(v => v.name).join(', ')}`
        : invalidVars.length > 0
        ? `Invalid variables: ${invalidVars.map(v => v.name).join(', ')}`
        : undefined,
  };
}

// ============================================
// Supabase Client Initialization
// ============================================

let supabaseClient: any = null;

export async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
}

// ============================================
// Database Health Check
// ============================================

export async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const supabase = await getSupabaseClient();

    // Execute a simple query to check database connectivity
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    // If there's an error other than table not existing, throw it
    if (dbError && dbError.code !== '42P01') {
      throw dbError;
    }

    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// Auth Health Check
// ============================================

export async function checkAuthHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Check auth version endpoint directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });

    if (response.ok) {
      const latency = Date.now() - startTime;
      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Auth health check failed: ${response.status}`);
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Auth service unavailable',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// Storage Health Check
// ============================================

export async function checkStorageHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const supabase = await getSupabaseClient();

    // List storage buckets to verify connectivity
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      throw error;
    }

    const latency = Date.now() - startTime;
    const configuredBuckets = STORAGE_BUCKETS.map((b: { name: string }) => b.name);
    const existingBuckets = data?.map((b: { name: string }) => b.name) || [];
    const missingBuckets = configuredBuckets.filter((b: string) => !existingBuckets.includes(b));

    return {
      status: missingBuckets.length > 0 ? 'degraded' : 'healthy',
      latency,
      error: missingBuckets.length > 0
        ? `Missing buckets: ${missingBuckets.join(', ')}`
        : undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Storage service unavailable',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// Combined Infrastructure Health
// ============================================

export async function getInfrastructureHealth(): Promise<InfrastructureHealth> {
  const [database, auth, storage, environment] = await Promise.all([
    checkDatabaseHealth(),
    checkAuthHealth(),
    checkStorageHealth(),
    Promise.resolve(getEnvironmentHealth()),
  ]);

  // Determine overall status
  const statuses = [database.status, auth.status, storage.status, environment.status];
  const overall: HealthStatus =
    statuses.includes('unhealthy')
      ? 'unhealthy'
      : statuses.includes('degraded')
      ? 'degraded'
      : 'healthy';

  return {
    overall,
    database,
    auth,
    storage,
    environment,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}

// ============================================
// Quick Health Summary
// ============================================

export async function getHealthSummary(): Promise<{ healthy: boolean; services: string[] }> {
  const health = await getInfrastructureHealth();

  return {
    healthy: health.overall === 'healthy',
    services: [
      `database:${health.database.status}`,
      `auth:${health.auth.status}`,
      `storage:${health.storage.status}`,
      `env:${health.environment.status}`,
    ],
  };
}