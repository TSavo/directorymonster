import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { verifyProof } from '@/lib/zkp';
import jwt from 'jsonwebtoken';

interface VerifyRequestBody {
  username: string;
  proof: any;
  publicSignals: any;
}

/**
 * Verify authentication credentials using ZKP
 * 
 * This endpoint receives a zero-knowledge proof and verifies it against
 * the user's public key stored in the database. If the proof is valid,
 * it returns a JWT token for authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Log for debugging
    console.log('Verification request received');
    
    // Check for CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      console.warn('Missing CSRF token in request');
      return NextResponse.json(
        { success: false, error: 'Missing CSRF token' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json() as VerifyRequestBody;
    
    // Log for debugging (in production, you would not log the proof)
    console.log('Verification request body received:', {
      username: body.username,
      proofReceived: body.proof ? 'Yes' : 'No',
      publicSignalsReceived: body.publicSignals ? 'Yes' : 'No'
    });
    
    // Validate required fields
    if (!body.username || !body.proof || !body.publicSignals) {
      console.warn('Missing required fields in request');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check rate limiting
    const rateLimitKey = `ratelimit:login:${body.username}`;
    const failedAttempts = await kv.get(rateLimitKey) as number || 0;
    
    if (failedAttempts >= 5) {
      console.warn(`Rate limit exceeded for user ${body.username}`);
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
      console.warn(`User not found: ${body.username}`);
      
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
      console.warn(`Locked account attempt: ${body.username}`);
      return NextResponse.json(
        { success: false, error: 'Account locked. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Log for debugging
    console.log(`Verifying proof for user ${body.username}`);
    
    // Verify the proof using ZKP
    const isValid = await verifyProof({
      proof: body.proof,
      publicSignals: body.publicSignals,
      publicKey: user.publicKey,
    });
    
    if (!isValid) {
      console.warn(`Invalid proof for user ${body.username}`);
      
      // Increment failed attempts
      await kv.set(rateLimitKey, failedAttempts + 1);
      await kv.expire(rateLimitKey, 60 * 15); // 15 minutes
      
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Authentication successful, reset failed attempts
    console.log(`Authentication successful for user ${body.username}`);
    await kv.del(rateLimitKey);
    
    // Update last login timestamp
    const updatedUser = {
      ...user,
      lastLogin: Date.now(),
    };
    
    await kv.set(userKey, updatedUser);
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'development-secret';
    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
        userId: user.id,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Log for debugging
    console.log(`Generated JWT token for user ${body.username}`);
    
    // Return success with token and user info (exclude sensitive info)
    return NextResponse.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
        id: user.id,
        lastLogin: updatedUser.lastLogin,
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
