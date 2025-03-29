// Redis keys debug endpoint - available only in development/test environments
import { redis } from '@/lib/redis-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/debug/redis-keys
 * 
 * Lists all Redis keys or keys matching a pattern (for debugging purposes)
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
    // Get pattern from query parameter or default to '*'
    const { searchParams } = new URL(req.url);
    const pattern = searchParams.get('pattern') || '*';
    
    // Get all keys matching the pattern
    const keys = await redis.keys(pattern);
    
    return NextResponse.json(keys, { status: 200 });
  } catch (error) {
    console.error('Redis keys error:', error);
    return NextResponse.json(
      { error: 'Failed to get Redis keys', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}