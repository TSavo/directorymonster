import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';

/**
 * Get the salt for a user by username
 * 
 * This endpoint is used to retrieve the salt for a user, which is needed
 * to generate a zero-knowledge proof for authentication. This endpoint
 * does not require authentication since the salt alone is not sensitive.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    
    // Validate username
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Get user from database
    const userKey = `user:${username}`;
    const user = await kv.get(userKey);
    
    // Check if user exists
    if (!user) {
      // For security reasons, we don't want to reveal whether a user exists
      // So we return a random salt that won't work
      const randomSalt = Math.random().toString(36).substring(2, 15);
      
      return NextResponse.json({
        success: true,
        salt: randomSalt
      });
    }
    
    // Return the user's salt
    return NextResponse.json({
      success: true,
      salt: user.salt
    });
  } catch (error) {
    console.error('Error retrieving salt:', error);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
