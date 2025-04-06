import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';

/**
 * GET handler for security metrics
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response containing security metrics or an error message
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'security' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        // Get query parameters
        const url = new URL(validatedReq.url);
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
    }
  );
}
