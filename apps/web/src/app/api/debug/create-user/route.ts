// ============================================
// Debug: Direct Create User Test Endpoint
// ============================================
// This endpoint tests the exact auth.admin.createUser call
// with ONLY the service role key, no wrappers or middleware.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Separate function to test auth.admin.createUser
async function testCreateUser(): Promise<{
  success: boolean;
  data?: { id: string; email: string };
  error?: {
    message: string;
    code: string | undefined;
    name: string;
  };
  debug: Record<string, unknown>;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const debug: Record<string, unknown> = {
    envCheck: {
      hasUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasAnonKey: !!anonKey,
    },
    keyPrefixes: {
      serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 20),
      anonKeyPrefix: anonKey?.substring(0, 20),
    },
    keysMatch: serviceRoleKey === anonKey,
  };

  console.log('[DEBUG - CREATE USER] Testing with:');
  console.log('  URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('  Service Role Key exists:', !!serviceRoleKey);
  console.log('  Anon Key exists:', !!anonKey);
  console.log('  Keys match:', serviceRoleKey === anonKey);

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false,
      error: { message: 'Missing environment variables', code: 'MISSING_ENV', name: 'Error' },
      debug,
    };
  }

  try {
    // Create client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First, verify the client works by checking auth state
    debug.clientCreated = true;
    debug.authEndpoint = `${supabaseUrl}/auth/v1/admin/users`;

    console.log('[DEBUG - CREATE USER] Calling auth.admin.createUser...');
    console.log('[DEBUG - CREATE USER] Endpoint:', debug.authEndpoint);

    const testEmail = `debug-${Date.now()}@test.sitesbd.local`;
    const testPassword = 'TempPassword123!';

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    debug.responseReceived = true;
    debug.responseData = data ? { id: data.user?.id, email: data.user?.email } : null;
    debug.responseError = error ? {
      message: error.message,
      code: error.code,
      name: error.name,
    } : null;

    console.log('[DEBUG - CREATE USER] Result:', {
      success: !!data?.user,
      error: debug.responseError,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          name: error.name,
        },
        debug,
      };
    }

    return {
      success: true,
      data: { id: data.user!.id, email: data.user!.email || '' },
      debug,
    };
  } catch (err) {
    debug.exception = true;
    debug.exceptionMessage = err instanceof Error ? err.message : String(err);
    console.error('[DEBUG - CREATE USER] Exception:', err);

    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : String(err),
        code: 'EXCEPTION',
        name: 'Error',
      },
      debug,
    };
  }
}

export async function POST(_request: NextRequest) {
  try {
    const result = await testCreateUser();

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    }, { status: result.success ? 200 : 400 });

  } catch (error) {
    console.error('[DEBUG - CREATE USER] Top-level exception:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: 'TOP_LEVEL_EXCEPTION',
        name: 'Error',
      },
    }, { status: 500 });
  }
}

// Also allow GET for simple testing
export async function GET(_request: NextRequest) {
  console.log('[DEBUG - CREATE USER] GET request received');
  
  return NextResponse.json({
    endpoint: 'POST to create test user',
    method: 'POST',
    description: 'Tests auth.admin.createUser with service role key',
    envCheck: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    timestamp: new Date().toISOString(),
  });
}