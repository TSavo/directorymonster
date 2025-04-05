import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { verifyProof } from '@/lib/zkp';
import { verifyZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';
import { withRateLimit } from '@/middleware/withRateLimit';

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      const { token, email, proof, publicSignals } = await request.json();

      // Validate required fields
      if (!token || !email || !proof || !publicSignals) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate the reset token
      const resetInfo = await kv.get(`reset:${token}`);

      if (!resetInfo || resetInfo.email !== email || resetInfo.expiresAt < Date.now()) {
        return NextResponse.json(
          { success: false, error: 'Reset token expired or invalid' },
          { status: 400 }
        );
      }

      // Find the user by email
      const users = await kv.keys('user:*');
      const userPromises = users.map(async (key) => {
        const user = await kv.get(key);
        if (user?.email === email) {
          return { key, user };
        }
        return null;
      });

      const results = await Promise.all(userPromises);
      const userMatch = results.find(result => result !== null);

      if (!userMatch) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const { key, user } = userMatch;

      // Verify the proof using ZKP with bcrypt
      const isValid = await verifyZKPWithBcrypt(
        proof,
        publicSignals,
        user.publicKey // We verify against the old public key
      );

      if (!isValid) {
        console.warn(`Invalid proof for password reset: ${email}`);
        return NextResponse.json(
          { success: false, error: 'Invalid proof' },
          { status: 400 }
        );
      }

      // Extract the new public key from the public signals
      // The first element of publicSignals is the new public key
      const newPublicKey = publicSignals[0];

      // Update user in database
      await kv.set(key, {
        ...user,
        publicKey: newPublicKey,
        passwordResetAt: Date.now(),
      });

      // Delete the used reset token
      await kv.del(`reset:${token}`);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Password reset confirmation error:', error);

      return NextResponse.json(
        { success: false, error: 'Failed to reset password' },
        { status: 500 }
      );
    }
  },
  {
    // Rate limit to 5 password reset confirmations per hour per IP address
    limit: 5,
    windowInSeconds: 3600, // 1 hour
    // Use IP address for rate limiting password reset confirmations
    identifierFn: (req: NextRequest) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      return `confirm-reset:${ip}`;
    },
    // Custom response when rate limit is exceeded
    onRateLimitExceeded: (req: NextRequest, resetInSeconds: number) => {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many password reset attempts',
          message: `Rate limit exceeded. Please try again in ${Math.ceil(resetInSeconds / 60)} minutes.`
        },
        {
          status: 429,
          headers: { 'Retry-After': resetInSeconds.toString() }
        }
      );
    }
  }
);
