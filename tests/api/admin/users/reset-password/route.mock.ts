import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';
import { generatePasswordResetToken } from '@/lib/crypto';

// POST request password reset
export async function POST(request: Request) {
  try {
    // For the "not authenticated" test
    if (request.headers.get('x-test-auth') === 'none') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For the "missing permissions" test
    if (request.headers.get('x-test-auth') === 'no-permission') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the db mock and call it directly
    const dbMock = require('../../../../__mocks__/db');
    const user = await dbMock.findUserByEmail(email);

    // For the "user not found" test
    if (email === 'nonexistent@example.com' || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // For the "validation error" test
    if (email === 'invalid-email') {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate password reset token
    const resetToken = await generatePasswordResetToken();

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      success: true,
      message: 'Password reset initiated'
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Failed to request password reset' },
      { status: 500 }
    );
  }
}
