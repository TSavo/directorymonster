import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { SubmissionRedisService } from '@/lib/submission-redis-service';
import { Submission, SubmissionStatus } from '@/types/submission';
import { v4 as uuidv4 } from 'uuid';
import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

/**
 * GET handler for retrieving user's submissions for a specific site
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the site slug
 * @returns A JSON response containing the user's submissions or an error message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { siteSlug: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      const userId = context.userId;
      try {
        const { siteSlug } = params;

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
            { error: 'You are not allowed to submit content to this site' },
            { status: 403 }
          );
        }

        // Get query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const status = url.searchParams.get('status');

        // Get all submissions for this site
        const allSubmissions = await SubmissionRedisService.getSubmissionsBySite(site.id);

        // Filter submissions by user ID
        let filteredSubmissions = allSubmissions.filter(submission => submission.userId === userId);

        // Filter by status if provided
        if (status) {
          filteredSubmissions = filteredSubmissions.filter(submission => submission.status === status);
        }

        // Sort by creation date (newest first)
        filteredSubmissions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

        // Return paginated results
        return NextResponse.json({
          data: paginatedSubmissions,
          pagination: {
            page,
            perPage: limit,
            total: filteredSubmissions.length,
            totalPages: Math.ceil(filteredSubmissions.length / limit)
          }
        });
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch submissions' },
          { status: 500 }
        );
      }
  });
}

/**
 * POST handler for creating a new submission for a specific site
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the site slug
 * @returns A JSON response containing the created submission or an error message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { siteSlug: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'create' as Permission,
    async (validatedReq, context) => {
      const userId = context.userId;
      try {
        const { siteSlug } = params;

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
            { error: 'You are not allowed to submit content to this site' },
            { status: 403 }
          );
        }

        // Parse request body
        const submissionData = await validatedReq.json();

        // Validate required fields
        if (!submissionData.title) {
          return NextResponse.json(
            { error: 'Title is required' },
            { status: 400 }
          );
        }

        if (!submissionData.description) {
          return NextResponse.json(
            { error: 'Description is required' },
            { status: 400 }
          );
        }

        if (!submissionData.categoryIds || !Array.isArray(submissionData.categoryIds) || submissionData.categoryIds.length === 0) {
          return NextResponse.json(
            { error: 'At least one category ID is required' },
            { status: 400 }
          );
        }

        // Create the submission object
        const submission: Submission = {
          id: `sub-${uuidv4()}`,
          siteId: site.id,
          tenantId: site.tenantId,
          title: submissionData.title,
          description: submissionData.description,
          content: submissionData.content,
          categoryIds: submissionData.categoryIds,
          status: SubmissionStatus.PENDING,
          media: submissionData.media || [],
          userId,
          customFields: submissionData.customFields,
          backlinkInfo: submissionData.backlinkInfo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Create the submission
        const newSubmission = await SubmissionRedisService.createSubmission(submission);

        // Return the created submission
        return NextResponse.json(newSubmission, { status: 201 });
      } catch (error) {
        console.error('Error creating submission:', error);
        return NextResponse.json(
          { error: 'Failed to create submission' },
          { status: 500 }
        );
      }
  });
}
