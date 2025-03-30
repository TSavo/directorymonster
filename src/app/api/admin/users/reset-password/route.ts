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
    const user = await db.user.findUnique({
      where: { email }
    });
    
    // Always return success, even if user not found (prevents email enumeration)
    if (!user) {
      return NextResponse.json({ success: true });
    }
    
    // Generate password reset token
    const resetToken = await generatePasswordResetToken();
    
    // Store token in database with expiration
    await db.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: resetToken,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour expiration
      },
      create: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour expiration
      }
    });
    
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
