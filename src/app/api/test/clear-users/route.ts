import { NextRequest, NextResponse } from 'next/server';
import { clearUsers, kv } from '@/lib/redis-client';

/**
 * Clear all users from the database.
 * This endpoint is for testing purposes only and should be disabled in production.
 */
export async function POST(request: NextRequest) {
  try {
    // This is a test-only endpoint
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Endpoint disabled in production' },
        { status: 403 }
      );
    }
    
    // Get all user keys for debugging
    const beforeUserKeys = await kv.keys('user:*');
    console.log('User keys before clearing:', beforeUserKeys);
    
    // Clear all users
    await clearUsers();
    
    // Verify users were cleared
    const afterUserKeys = await kv.keys('user:*');
    console.log('User keys after clearing:', afterUserKeys);
    
    // Get all keys in the store for debugging
    const allKeys = await kv.keys('*');
    console.log('All keys in store after clearing users:', allKeys);
    
    return NextResponse.json({
      success: true,
      message: 'All users have been cleared',
      beforeCount: beforeUserKeys.length,
      afterCount: afterUserKeys.length,
      remainingKeys: allKeys
    });
  } catch (error) {
    console.error('Error clearing users:', error);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
