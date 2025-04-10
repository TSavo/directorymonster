import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { SubmissionRedisService } from '@/lib/submission-redis-service';
import { SubmissionStatus } from '@/types/submission';
import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

/**
 * GET handler for retrieving a specific submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the site slug and submission ID
 * @returns A JSON response containing the submission or an error message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { siteSlug: string; submissionId: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      const userId = context.userId;
      try {
        const { siteSlug, submissionId } = params;

        // Get site by slug
        const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);

        if (!site) {
          return NextResponse.json(
            { error: 'Site not found' },
            { status: 404 }
          );
        }

        // Check if submissions are enabled for this site
        if (site.settings?.disableSubmissions) {
          return NextResponse.json(
            { error: 'Submissions are disabled for this site' },
            { status: 403 }
          );
        }

        // Check if user is blocked from submitting
        const isUserBlocked = await kv.get(`site:${site.id}:blocked-users:${userId}`);
        if (isUserBlocked) {
          return NextResponse.json(
            { error: 'You are not allowed to access submissions for this site' },
            { status: 403 }
          );
        }

        // Get the submission
        const submission = await SubmissionRedisService.getSubmission(site.id, submissionId);

        if (!submission) {
          return NextResponse.json(
            { error: 'Submission not found' },
            { status: 404 }
          );
        }

        // Check if the submission belongs to the user
        if (submission.userId !== userId) {
          return NextResponse.json(
            { error: 'You do not have permission to access this submission' },
            { status: 403 }
          );
        }

        // Return the submission
        return NextResponse.json(submission);
      } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json(
          { error: 'Failed to fetch submission' },
          { status: 500 }
        );
      }
  });
}

/**
 * PUT handler for updating a specific submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the site slug and submission ID
 * @returns A JSON response containing the updated submission or an error message
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { siteSlug: string; submissionId: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'update' as Permission,
    async (validatedReq, context) => {
      const userId = context.userId;
      try {
        const { siteSlug, submissionId } = params;

        // Get site by slug
        const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);

        if (!site) {
          return NextResponse.json(
            { error: 'Site not found' },
            { status: 404 }
          );
        }

        // Check if submissions are enabled for this site
        if (site.settings?.disableSubmissions) {
          return NextResponse.json(
            { error: 'Submissions are disabled for this site' },
            { status: 403 }
          );
        }

        // Check if user is blocked from submitting
        const isUserBlocked = await kv.get(`site:${site.id}:blocked-users:${userId}`);
        if (isUserBlocked) {
          return NextResponse.json(
            { error: 'You are not allowed to update submissions for this site' },
            { status: 403 }
          );
        }

        // Get the existing submission
        const submission = await SubmissionRedisService.getSubmission(site.id, submissionId);

        if (!submission) {
          return NextResponse.json(
            { error: 'Submission not found' },
            { status: 404 }
          );
        }

        // Check if the submission belongs to the user
        if (submission.userId !== userId) {
          return NextResponse.json(
            { error: 'You do not have permission to update this submission' },
            { status: 403 }
          );
        }

        // Check if the submission can be updated
        if (submission.status !== SubmissionStatus.PENDING && submission.status !== SubmissionStatus.CHANGES_REQUESTED) {
          return NextResponse.json(
            { error: 'This submission cannot be updated because it has already been processed' },
            { status: 400 }
          );
        }

        // Parse request body
        const updateData = await validatedReq.json();

        // Validate required fields
        if (!updateData.title) {
          return NextResponse.json(
            { error: 'Title is required' },
            { status: 400 }
          );
        }

        if (!updateData.description) {
          return NextResponse.json(
            { error: 'Description is required' },
            { status: 400 }
          );
        }

        if (!updateData.categoryIds || !Array.isArray(updateData.categoryIds) || updateData.categoryIds.length === 0) {
          return NextResponse.json(
            { error: 'At least one category ID is required' },
            { status: 400 }
          );
        }

        // Update the submission
        const updatedSubmission = await SubmissionRedisService.updateSubmission(site.id, submissionId, {
          title: updateData.title,
          description: updateData.description,
          content: updateData.content,
          categoryIds: updateData.categoryIds,
          media: updateData.media,
          customFields: updateData.customFields,
          backlinkInfo: updateData.backlinkInfo,
          status: SubmissionStatus.PENDING, // Reset to pending if it was in changes requested state
          updatedAt: new Date().toISOString()
        });

        // Return the updated submission
        return NextResponse.json(updatedSubmission);
      } catch (error) {
        console.error('Error updating submission:', error);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }
  });
}

/**
 * DELETE handler for withdrawing a specific submission
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the site slug and submission ID
 * @returns A JSON response indicating success or an error message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { siteSlug: string; submissionId: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'delete' as Permission,
    async (validatedReq, context) => {
      const userId = context.userId;
      try {
        const { siteSlug, submissionId } = params;

        // Get site by slug
        const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);

        if (!site) {
          return NextResponse.json(
            { error: 'Site not found' },
            { status: 404 }
          );
        }

        // Check if submissions are enabled for this site
        if (site.settings?.disableSubmissions) {
          return NextResponse.json(
            { error: 'Submissions are disabled for this site' },
            { status: 403 }
          );
        }

        // Check if user is blocked from submitting
        const isUserBlocked = await kv.get(`site:${site.id}:blocked-users:${userId}`);
        if (isUserBlocked) {
          return NextResponse.json(
            { error: 'You are not allowed to withdraw submissions for this site' },
            { status: 403 }
          );
        }

        // Get the existing submission
        const submission = await SubmissionRedisService.getSubmission(site.id, submissionId);

        if (!submission) {
          return NextResponse.json(
            { error: 'Submission not found' },
            { status: 404 }
          );
        }

        // Check if the submission belongs to the user
        if (submission.userId !== userId) {
          return NextResponse.json(
            { error: 'You do not have permission to withdraw this submission' },
            { status: 403 }
          );
        }

        // Check if the submission can be withdrawn
        if (submission.status === SubmissionStatus.APPROVED) {
          return NextResponse.json(
            { error: 'This submission cannot be withdrawn because it has already been approved' },
            { status: 400 }
          );
        }

        // Update the submission status to withdrawn
        await SubmissionRedisService.updateSubmission(site.id, submissionId, {
          status: SubmissionStatus.WITHDRAWN,
          updatedAt: new Date().toISOString()
        });

        // Return success response
        return NextResponse.json({
          success: true,
          message: 'Submission withdrawn successfully'
        });
      } catch (error) {
        console.error('Error withdrawing submission:', error);
        return NextResponse.json(
          { error: 'Failed to withdraw submission' },
          { status: 500 }
        );
      }
  });
}
