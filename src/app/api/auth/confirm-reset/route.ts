import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { verifyProof } from '@/lib/zkp';

export async function POST(request: NextRequest) {
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
      if (user && user.email === email) {
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

    // Verify the proof using ZKP
    const isValid = await verifyProof({
      proof,
      publicSignals,
      publicKey: user.publicKey, // We verify against the old public key
    });

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
}
