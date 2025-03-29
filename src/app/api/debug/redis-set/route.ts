// Redis SET debug endpoint - available only in development/test environments
import { redis } from '@/lib/redis-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/debug/redis-set
 * 
 * Sets a Redis key's value (for debugging purposes)
 * This endpoint is only available in development and test environments
 */
export async function POST(req: NextRequest) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Get key and value from request body
    const body = await req.json();
    const { key, value } = body;
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }
    
    if (value === undefined) {
      return NextResponse.json(
        { error: 'Value parameter is required' },
        { status: 400 }
      );
    }
    
    // Convert value to string if it's not already
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Set value in Redis
    await redis.set(key, stringValue);
    
    return NextResponse.json({ success: true, key, value }, { status: 200 });
  } catch (error) {
    console.error('Redis SET error:', error);
    return NextResponse.json(
      { error: 'Failed to set Redis value', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}