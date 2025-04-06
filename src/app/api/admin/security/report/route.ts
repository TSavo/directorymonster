import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';

/**
 * POST handler for reporting suspicious activity
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response indicating success or an error message
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'security' as ResourceType,
    'manage' as Permission,
    async (validatedReq, context) => {
      try {
        const body = await validatedReq.json();

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
    }
  );
}
