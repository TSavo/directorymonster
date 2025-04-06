import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { db } from '@/lib/db';
import { SubmissionStatus } from '@/types/submission';

/**
 * POST handler for rejecting a submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the submission ID
 * @returns A JSON response containing the rejected submission or an error message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'reject' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;
        const tenantId = validatedReq.headers.get('x-tenant-id');
        const reviewerId = context.userId;

        if (!tenantId) {
          return NextResponse.json(
            { error: 'Missing tenant ID' },
            { status: 400 }
          );
        }

        // Get the existing submission
        const existingSubmission = await db.submission.findUnique({
          where: { id, tenantId }
        });

        if (!existingSubmission) {
          return NextResponse.json(
            { error: 'Submission not found' },
            { status: 404 }
          );
        }

        // Parse request body
        const { reviewNotes } = await validatedReq.json();

        // Update the submission status to rejected
        const rejectedSubmission = await db.submission.update({
          where: { id, tenantId },
          data: {
            status: SubmissionStatus.REJECTED,
            reviewerId,
            reviewNotes,
            reviewedAt: new Date()
          },
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        return NextResponse.json({ submission: rejectedSubmission });
      } catch (error) {
        console.error('Error rejecting submission:', error);
        return NextResponse.json(
          { error: 'Failed to reject submission' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
