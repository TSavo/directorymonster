import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';

/**
 * Clear all users from the database - FOR TESTING ONLY
 * 
 * This endpoint should be disabled in production!
 */
export async function POST(request: NextRequest) {
  try {
    // Security: This should only be enabled in development/test environments
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is not available in production' },
        { status: 403 }
      );
    }
    
    // Get all keys with the "user:" prefix
    const userKeys = await kv.keys('user:*');
    
    // Delete each user key
    let deletedCount = 0;
    for (const key of userKeys) {
      await kv.del(key);
      deletedCount++;
    }
    
    // Return the result
    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} users from the database`
    });
  } catch (error) {
    console.error('Error clearing users:', error);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
