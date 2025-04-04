import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePasswordResetToken } from '@/lib/crypto';
import { sendPasswordResetEmail } from '@/lib/email';

// POST request password reset
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.findUserByEmail(email);

    // Always return success, even if user not found (prevents email enumeration)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate password reset token
    const resetToken = await generatePasswordResetToken();

    // Store token in database with expiration
    // In a real implementation, this would store the token in the database
    // For testing, we'll just log it
    console.log(`Storing reset token ${resetToken} for user ${user.id}`);

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Failed to request password reset' },
      { status: 500 }
    );
  }
}
