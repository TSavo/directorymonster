import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // In a real implementation, you would fetch this data from your database
    // For now, we'll return mock data
    const metrics = {
      totalAttempts: 125,
      successfulAttempts: 87,
      failedAttempts: 38,
      blockedAttempts: 12,
      captchaRequiredCount: 18,
      highRiskIPs: 5
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
});
