import { NextResponse } from 'next/server';
import { checkRedisConnection } from '@/lib/redis-health';

export async function GET() {
  const redisStatus = await checkRedisConnection();
  
  const healthStatus = {
    status: redisStatus.status === 'ok' ? 'healthy' : 'unhealthy',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    message: 'Live file editing is working!',
    services: {
      redis: redisStatus,
    },
  };
  
  return NextResponse.json(
    healthStatus,
    { 
      status: redisStatus.status === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  );
}