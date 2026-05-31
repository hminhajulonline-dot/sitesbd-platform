import { NextResponse } from 'next/server';
import { getInfrastructureHealth } from '@sitesbd/shared/services/health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const health = await getInfrastructureHealth();

    const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        overall: 'unhealthy',
        database: { status: 'unhealthy', error: 'Health check failed', timestamp: new Date().toISOString() },
        auth: { status: 'unhealthy', error: 'Health check failed', timestamp: new Date().toISOString() },
        storage: { status: 'unhealthy', error: 'Health check failed', timestamp: new Date().toISOString() },
        environment: { status: 'unhealthy', error: 'Health check failed', timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      { status: 503 }
    );
  }
}
