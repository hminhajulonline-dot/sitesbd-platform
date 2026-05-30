import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    app: 'dashboard',
    timestamp: new Date().toISOString(),
  });
}
