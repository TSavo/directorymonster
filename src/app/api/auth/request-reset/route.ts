import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import crypto from 'crypto';

// In a real app, you would send an email
async function sendResetEmail(email: string, token: string, resetLink: string) {
  // This is a mock implementation
  console.log(`Sending reset email to ${email} with token ${token}`);
  console.log(`Reset link: ${resetLink}`);
  
  // In a real app, you would use a proper email service like SendGrid, AWS SES, etc.
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid email' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const users = await kv.keys('user:*');
    const userPromises = users.map(async (key) => {
      const user = await kv.get(key);
      return user;
    });
    
    const allUsers = await Promise.all(userPromises);
    const userExists = allUsers.some(user => user && user.email === email);
    
    // For security reasons, always return success even if user doesn't exist
    // This prevents enumeration attacks
    
    // Generate a reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 hour from now
    
    // Store the reset token
    if (userExists) {
      await kv.set(`reset:${token}`, {
        email,
        expiresAt,
      });
      
      // Set expiration for the token
      await kv.expire(`reset:${token}`, 3600); // 1 hour
      
      // Construct reset link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const resetLink = `${baseUrl}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      
      // Send reset email (in a real app)
      await sendResetEmail(email, token, resetLink);
    }
    
    // Always return success to prevent enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
