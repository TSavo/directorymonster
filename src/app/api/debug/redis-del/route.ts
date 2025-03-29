// Redis DEL debug endpoint - available only in development/test environments
import { redis } from '@/lib/redis-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/debug/redis-del
 * 
 * Deletes a Redis key (for debugging purposes)
 * This endpoint is only available in development and test environments
 */
export async function DELETE(req: NextRequest) {
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
    
    // Delete key from Redis
    const result = await redis.del(key);
    
    return NextResponse.json({ 
      success: true, 
      key, 
      deleted: result === 1 
    }, { status: 200 });
  } catch (error) {
    console.error('Redis DEL error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Redis key', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}