export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'SitesBD Platform',
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  version: '0.1.0',
} as const;

export const API_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID || '',
} as const;
