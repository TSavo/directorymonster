import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { generateSalt, generatePublicKey } from '@/lib/zkp';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface SetupRequestBody {
  username: string;
  password: string;
  email?: string;
  siteName: string;
}

/**
 * Setup the first admin user
 * 
 * This endpoint handles the creation of the first admin user
 * when the system is freshly installed. It will only work if
 * no users currently exist in the system.
 */
export async function POST(request: NextRequest) {
  try {
    // Log for debugging
    console.log('Setup request received');
    
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
    const body = await request.json() as SetupRequestBody;
    
    // Validate required fields
    if (!body.username || !body.password || !body.siteName) {
      console.warn('Missing required fields in setup request');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if any users already exist
    const userKeys = await kv.keys('user:*');
    if (userKeys.length > 0) {
      console.warn('Attempted to setup first user when users already exist');
      return NextResponse.json(
        { success: false, error: 'Users already exist in the system' },
        { status: 403 }
      );
    }
    
    // Generate salt for password hashing
    const salt = generateSalt();
    
    // Generate public key from password and salt
    const publicKey = await generatePublicKey({
      username: body.username,
      password: body.password,
      salt,
    });
    
    // Generate unique ID for user
    const userId = uuidv4();
    
    // Create user object
    const user = {
      id: userId,
      username: body.username,
      email: body.email || null,
      role: 'admin', // First user is always admin
      publicKey,
      salt,
      created: Date.now(),
      lastLogin: null,
      locked: false,
    };
    
    // Create initial site
    const siteId = uuidv4();
    const site = {
      id: siteId,
      name: body.siteName,
      slug: body.siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      domains: ['localhost'],
      isDefault: true,
      createdBy: userId,
      created: Date.now(),
      updated: Date.now(),
    };
    
    // Save user and site to database
    await kv.set(`user:${body.username}`, user);
    await kv.set(`site:${siteId}`, site);
    await kv.set(`sites:by-slug:${site.slug}`, siteId);
    
    // Add site to default domains map
    await kv.set(`domains:localhost`, siteId);
    
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
    console.log(`Created first admin user ${body.username} and site ${body.siteName}`);
    
    // Return success with token and user info (exclude sensitive info)
    return NextResponse.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
        id: user.id,
      },
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Server error during setup' },
      { status: 500 }
    );
  }
}
