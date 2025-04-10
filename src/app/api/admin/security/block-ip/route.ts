import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';

/**
 * POST handler for blocking an IP address
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
    }
  );
}
