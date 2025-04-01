import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * GET /api/admin/listings/:id
 *
 * Retrieves a specific listing by ID
 * Requires 'read' permission on 'listing' resource
 *
 * @param req The incoming request
 * @param params Route parameters containing the listing ID
 * @returns Listing data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'listing' as ResourceType,
      'read' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and listing ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const listingId = params.id;

          // Get the listing from Redis
          const listing = await kv.get(`listing:id:${listingId}`);

          // Check if listing exists
          if (!listing) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          // Check if listing belongs to the tenant
          if (listing.tenantId !== tenantId) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          return NextResponse.json({ listing });
        } catch (error) {
          console.error('Error retrieving listing:', error);
          return NextResponse.json(
            { error: 'Failed to retrieve listing' },
            { status: 500 }
          );
        }
      }
    )
  );
}

/**
 * PUT /api/admin/listings/:id
 *
 * Updates a specific listing by ID
 * Requires 'update' permission on 'listing' resource
 *
 * @param req The incoming request
 * @param params Route parameters containing the listing ID
 * @returns Updated listing data
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'listing' as ResourceType,
      'update' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and listing ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const listingId = params.id;

          // Parse the request body
          const data = await validatedReq.json();

          // Validate required fields
          if (!data.title) {
            return NextResponse.json(
              { error: 'Title is required' },
              { status: 400 }
            );
          }

          // Get the existing listing from Redis
          const existingListing = await kv.get(`listing:id:${listingId}`);

          // Check if listing exists
          if (!existingListing) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          // Check if listing belongs to the tenant
          if (existingListing.tenantId !== tenantId) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          // Update the listing
          const updatedListing = {
            ...existingListing,
            title: data.title,
            description: data.description || existingListing.description,
            status: data.status || existingListing.status,
            categoryIds: data.categoryIds || existingListing.categoryIds,
            customFields: data.customFields || existingListing.customFields,
            updatedAt: new Date().toISOString()
          };

          // Save the updated listing to Redis
          await kv.set(`listing:tenant:${tenantId}:${listingId}`, updatedListing);
          await kv.set(`listing:id:${listingId}`, updatedListing);

          return NextResponse.json({ listing: updatedListing });
        } catch (error) {
          console.error('Error updating listing:', error);
          return NextResponse.json(
            { error: 'Failed to update listing' },
            { status: 500 }
          );
        }
      }
    )
  );
}

/**
 * DELETE /api/admin/listings/:id
 *
 * Deletes a specific listing by ID
 * Requires 'delete' permission on 'listing' resource
 *
 * @param req The incoming request
 * @param params Route parameters containing the listing ID
 * @returns Success message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'listing' as ResourceType,
      'delete' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and listing ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const listingId = params.id;

          // Get the existing listing from Redis
          const existingListing = await kv.get(`listing:id:${listingId}`);

          // Check if listing exists
          if (!existingListing) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          // Check if listing belongs to the tenant
          if (existingListing.tenantId !== tenantId) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          // Delete the listing from Redis
          await kv.del(`listing:tenant:${tenantId}:${listingId}`);
          await kv.del(`listing:id:${listingId}`);

          return NextResponse.json({
            success: true,
            message: `Listing ${listingId} deleted successfully`
          });
        } catch (error) {
          console.error('Error deleting listing:', error);
          return NextResponse.json(
            { error: 'Failed to delete listing' },
            { status: 500 }
          );
        }
      }
    )
  );
}
