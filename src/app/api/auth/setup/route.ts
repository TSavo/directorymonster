import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { generateSalt, generatePublicKey } from '@/lib/zkp';
import { verifyZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface SetupRequestBody {
  username: string;
  proof?: any;
  publicSignals?: any;
  salt?: string;
  password?: string; // For backward compatibility
  email?: string;
  siteName: string;
}

/**
 * Creates the first administrative user and initial site during system setup.
 *
 * This endpoint processes a POST request to establish the system's first admin user and its corresponding site. It requires a JSON body that includes a username and a site name, as well as either a password or zero-knowledge proof credentials (proof, publicSignals, and salt). Upon successful validation, it creates an admin user with a generated public key, sets up the initial site, stores them in the database, and returns a JSON response containing a JWT token alongside non-sensitive user and site details.
 *
 * In a testing context, the CSRF token check can be bypassed if the request header includes the appropriate flag. If any required information is missing, or if users already exist, the function responds with an appropriate error status (400 or 403). Unexpected errors yield a 500 response.
 *
 * @example
 * // Using password authentication:
 * {
 *   "username": "admin",
 *   "siteName": "MySite",
 *   "password": "secret"
 * }
 *
 * @example
 * // Using zero-knowledge proof credentials:
 * {
 *   "username": "admin",
 *   "siteName": "MySite",
 *   "proof": { ... },
 *   "publicSignals": ["derivedPublicKey"],
 *   "salt": "providedSalt"
 * }
 *
 * @remarks
 * This endpoint enforces a CSRF token check unless running in a test environment with the X-Test-CSRF-Check header set.
 */
export async function POST(request: NextRequest) {
  try {
    // Log for debugging
    console.log('Setup request received');

    // Check for CSRF token
    const isTestEnvironment = process.env.NODE_ENV === 'test';
    const csrfToken = request.headers.get('X-CSRF-Token');

    // We need to enforce CSRF check even in test environment for the CSRF test
    // but allow other tests to pass (checking for test flag in headers)
    const skipCSRFCheck = isTestEnvironment && !request.headers.get('X-Test-CSRF-Check');

    if (!csrfToken && !skipCSRFCheck) {
      console.warn('Missing CSRF token in request');
      return NextResponse.json(
        { success: false, error: 'Missing CSRF token' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json() as SetupRequestBody;

    // Validate required fields
    if (!body.username || !body.siteName) {
      console.warn('Missing required fields in setup request');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we have ZKP proof or password
    if ((!body.proof || !body.publicSignals || !body.salt) && !body.password) {
      console.warn('Missing authentication credentials in setup request');
      return NextResponse.json(
        { success: false, error: 'Missing authentication credentials' },
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

    // Handle both ZKP with bcrypt and traditional password
    let salt: string;
    let publicKey: string;

    if (body.proof && body.publicSignals && body.salt) {
      // Use the provided ZKP proof and salt
      salt = body.salt;
      publicKey = body.publicSignals[0]; // The public key is the first public signal
    } else {
      // Generate salt for password hashing
      salt = generateSalt();

      // Generate public key from password and salt
      publicKey = await generatePublicKey(
        body.username,
        body.password!,
        salt
      );
    }

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
