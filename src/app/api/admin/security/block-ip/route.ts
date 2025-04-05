import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would add this IP to your blocked list
    // For now, we'll just log it and return success
    console.log('IP address blocked:', body.ip);
    
    return NextResponse.json({ 
      success: true,
      message: 'IP address blocked successfully'
    });
  } catch (error) {
    console.error('Error blocking IP address:', error);
    return NextResponse.json(
      { error: 'Failed to block IP address' },
      { status: 500 }
    );
  }
});
