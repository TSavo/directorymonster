import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { verifyProof } from '@/lib/zkp';
import jwt from 'jsonwebtoken';

interface VerifyRequestBody {
  username: string;
  proof: string;
  publicSignals: string[];
}

/**
 * Verify authentication credentials using ZKP
 */
export async function POST(request: NextRequest) {
  try {
    // Check for CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: 'Missing CSRF token' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json() as VerifyRequestBody;
    
    // Validate required fields
    if (!body.username || !body.proof || !body.publicSignals) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check rate limiting
    const rateLimitKey = `ratelimit:login:${body.username}`;
    const failedAttempts = await kv.get(rateLimitKey) as number || 0;
    
    if (failedAttempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Get user from database
    const userKey = `user:${body.username}`;
    const user = await kv.get(userKey);
    
    // Check if user exists
    if (!user) {
      // Increment failed attempts
      await kv.set(rateLimitKey, failedAttempts + 1);
      await kv.expire(rateLimitKey, 60 * 15); // 15 minutes
      
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if account is locked
    if (user.locked) {
      return NextResponse.json(
        { success: false, error: 'Account locked. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Verify the proof using ZKP
    const isValid = await verifyProof({
      proof: body.proof,
      publicSignals: body.publicSignals,
      publicKey: user.publicKey,
    });
    
    if (!isValid) {
      // Increment failed attempts
      await kv.set(rateLimitKey, failedAttempts + 1);
      await kv.expire(rateLimitKey, 60 * 15); // 15 minutes
      
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Authentication successful, reset failed attempts
    await kv.del(rateLimitKey);
    
    // Update last login timestamp
    const updatedUser = {
      ...user,
      lastLogin: Date.now(),
    };
    
    await kv.set(userKey, updatedUser);
    
    // Generate JWT token
    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
        userId: user.id,
      },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '1h' }
    );
    
    // Return success with token and user info (exclude sensitive info)
    return NextResponse.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
        id: user.id,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Authentication error' },
      { status: 500 }
    );
  }
}
