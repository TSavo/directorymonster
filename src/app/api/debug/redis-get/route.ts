// Redis GET debug endpoint - available only in development/test environments
import { redis } from '@/lib/redis-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/debug/redis-get
 * 
 * Retrieves a Redis key's value (for debugging purposes)
 * This endpoint is only available in development and test environments
 */
export async function GET(req: NextRequest) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Get key from query parameter
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }
    
    // Get value from Redis
    const value = await redis.get(key);
    
    // If value is JSON string, parse it
    try {
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        const parsedValue = JSON.parse(value);
        return NextResponse.json(parsedValue, { status: 200 });
      }
    } catch {
      // If parsing fails, return as-is
    }
    
    return NextResponse.json(value, { status: 200 });
  } catch (error) {
    console.error('Redis GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get Redis value', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}