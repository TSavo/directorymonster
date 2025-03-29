import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';

/**
 * Check if any users exist in the system
 * 
 * This endpoint is used to determine if we should show the
 * login form or the first user setup form.
 */
export async function GET(request: NextRequest) {
  try {
    // Check for CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      console.warn('Missing CSRF token in request');
      return NextResponse.json(
        { success: false, error: 'Missing CSRF token' },
        { status: 403 }
      );
    }
    
    // Get all keys with the "user:" prefix
    const userKeys = await kv.keys('user:*');
    
    // Debug output to identify existing keys
    console.log('Checking for users, found keys:', userKeys);
    
    // Return the result
    return NextResponse.json({
      success: true,
      hasUsers: userKeys.length > 0
    });
  } catch (error) {
    console.error('Error checking for users:', error);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
