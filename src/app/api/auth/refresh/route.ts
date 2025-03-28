import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import jwt from 'jsonwebtoken';

/**
 * Refresh authentication token
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'development-secret'
      ) as {
        username: string;
        role: string;
        userId: string;
      };
      
      // Get user from database to ensure they still exist and are not locked
      const userKey = `user:${decoded.username}`;
      const user = await kv.get(userKey);
      
      if (!user || user.locked) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      // Generate a new token
      const newToken = jwt.sign(
        {
          username: user.username,
          role: user.role,
          userId: user.id,
        },
        process.env.JWT_SECRET || 'development-secret',
        { expiresIn: '1h' }
      );
      
      // Return the new token
      return NextResponse.json({
        success: true,
        token: newToken,
      });
    } catch (error) {
      // Token verification failed
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
