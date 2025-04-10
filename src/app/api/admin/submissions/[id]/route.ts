import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { db } from '@/lib/db';

/**
 * GET handler for a specific submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the submission ID
 * @returns A JSON response containing the submission or an error message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;
        const tenantId = validatedReq.headers.get('x-tenant-id');

        if (!tenantId) {
          return NextResponse.json(
            { error: 'Missing tenant ID' },
            { status: 400 }
          );
        }

        // Get the submission
        const submission = await db.submission.findUnique({
          where: { id, tenantId },
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

        if (!submission) {
          return NextResponse.json(
            { error: 'Submission not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ submission });
      } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json(
          { error: 'Failed to fetch submission' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}

/**
 * PATCH handler for updating a submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the submission ID
 * @returns A JSON response containing the updated submission or an error message
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'update' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;
        const tenantId = validatedReq.headers.get('x-tenant-id');

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
        const updateData = await validatedReq.json();

        // Update the submission
        const updatedSubmission = await db.submission.update({
          where: { id, tenantId },
          data: {
            ...updateData,
            updatedAt: new Date()
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

        return NextResponse.json({ submission: updatedSubmission });
      } catch (error) {
        console.error('Error updating submission:', error);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}

/**
 * DELETE handler for removing a submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the submission ID
 * @returns A JSON response indicating success or an error message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'delete' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;
        const tenantId = validatedReq.headers.get('x-tenant-id');

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

        // Delete the submission
        await db.submission.delete({
          where: { id, tenantId }
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error deleting submission:', error);
        return NextResponse.json(
          { error: 'Failed to delete submission' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
