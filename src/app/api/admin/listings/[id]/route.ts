import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * Retrieves a listing by its ID if it exists and belongs to the tenant specified in the request headers.
 *
 * This endpoint requires that the request has valid tenant access with "read" permission on the listing resource.
 * It verifies that the listing exists in the data store and is associated with the tenant, returning the listing data in JSON format.
 * If the listing is not found or does not belong to the tenant, it responds with a 404 error; unexpected errors yield a 500 error.
 *
 * @param req - The incoming request, which must include tenant access headers.
 * @param params - An object containing the listing ID.
 * @returns A JSON response with either the listing data or an error message.
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
 * Updates a specific listing by its ID.
 *
 * This endpoint validates tenant access and requires update permission on the "listing" resource.
 * It parses the request body expecting at least a title, retrieves the existing listing,
 * verifies ownership, and merges the provided data with existing listing properties.
 * Upon success, it returns a JSON response containing the updated listing. If validation fails,
 * the listing is not found, or an internal error occurs, an appropriate error status is returned.
 *
 * @param req The incoming HTTP request.
 * @param params Contains the listing ID.
 * @returns A JSON response with the updated listing data.
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
 * Deletes an existing listing by its ID for a tenant.
 *
 * This endpoint validates tenant access and checks for the required 'delete' permission on listings. It ensures
 * that the listing exists and belongs to the tenant identified by the request header before deleting it from Redis.
 * If the listing is not found or is not owned by the tenant, a 404 response is returned. A 500 response is sent if an error occurs during deletion.
 *
 * @param params - An object containing route parameters, where `id` represents the listing identifier.
 * @returns A NextResponse with a JSON payload indicating the result of the deletion operation.
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
