import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.activityType) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      );
    }
    
    if (!body.description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would save this report to your database
    // For now, we'll just log it and return success
    console.log('Suspicious activity report received:', body);
    
    return NextResponse.json({ 
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
});
