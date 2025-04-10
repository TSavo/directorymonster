import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { db } from '@/lib/db';

/**
 * GET handler for submissions
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response containing submissions data, pagination metadata, or an error message
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        // Get query parameters
        const url = new URL(validatedReq.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const status = url.searchParams.get('status');
        const categoryId = url.searchParams.get('categoryId');
        const tenantId = validatedReq.headers.get('x-tenant-id');
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Missing tenant ID' },
            { status: 400 }
          );
        }
        
        // Prepare filter
        const filter: any = { tenantId };
        
        if (status) {
          filter.status = status;
        }
        
        if (categoryId) {
          filter.categoryId = categoryId;
        }
        
        // Calculate pagination
        const offset = (page - 1) * limit;
        
        // Get submissions
        const submissions = await db.submission.findMany({
          where: filter,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        
        // Get total count
        const totalItems = await db.submission.count({
          where: filter
        });
        
        return NextResponse.json({
          submissions,
          pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
          }
        });
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch submissions' },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * POST handler for creating a new submission
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response containing the created submission or an error message
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'submission' as ResourceType,
    'create' as Permission,
    async (validatedReq, context) => {
      try {
        // Get tenant ID from request headers
        const tenantId = validatedReq.headers.get('x-tenant-id');
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Missing tenant ID' },
            { status: 400 }
          );
        }
        
        // Parse request body
        const submissionData = await validatedReq.json();
        
        // Validate required fields
        if (!submissionData.title) {
          return NextResponse.json(
            { error: 'Submission title is required' },
            { status: 400 }
          );
        }
        
        if (!submissionData.categoryId) {
          return NextResponse.json(
            { error: 'Category ID is required' },
            { status: 400 }
          );
        }
        
        // Set tenant ID and user ID
        submissionData.tenantId = tenantId;
        submissionData.userId = context.userId;
        
        // Set initial status
        submissionData.status = 'pending';
        
        // Create the submission
        const newSubmission = await db.submission.create({
          data: submissionData,
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        
        return NextResponse.json({ submission: newSubmission });
      } catch (error) {
        console.error('Error creating submission:', error);
        return NextResponse.json(
          { error: 'Failed to create submission' },
          { status: 500 }
        );
      }
    }
  );
}
