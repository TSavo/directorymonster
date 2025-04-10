import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { db } from '@/lib/db';
import { Submission, SubmissionStatus, transformToListing } from '@/types/submission';

/**
 * POST handler for approving a submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the submission ID
 * @returns A JSON response containing the approved submission or an error message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'approve' as Permission,
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

        // Update the submission status to approved
        const approvedSubmission = await db.submission.update({
          where: { id, tenantId },
          data: {
            status: SubmissionStatus.APPROVED,
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

        // Transform the approved submission to a listing
        try {
          const listing = transformToListing(approvedSubmission as unknown as Submission);
          
          // Create the listing in the database
          await db.listing.create({
            data: {
              ...listing,
              submissionId: approvedSubmission.id
            }
          });
        } catch (error) {
          console.error('Error creating listing from submission:', error);
          // Continue with the approval process even if listing creation fails
        }

        return NextResponse.json({ submission: approvedSubmission });
      } catch (error) {
        console.error('Error approving submission:', error);
        return NextResponse.json(
          { error: 'Failed to approve submission' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
