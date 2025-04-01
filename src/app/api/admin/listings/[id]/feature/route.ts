import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * Toggles the featured status of a listing.
 *
 * This endpoint validates tenant access and listing management permissions before updating a listing's featured status in the datastore. The request must include a JSON body with a boolean `featured` value and contain a tenant identifier in the `x-tenant-id` header. If the listing does not exist or does not belong to the tenant, a 404 response is returned. On success, the listing is updated with the new featured status and timestamp, and the updated data is saved to Redis.
 *
 * @param req - The incoming NextRequest; it should include the tenant ID in the 'x-tenant-id' header.
 * @param params - An object containing the route parameter `id`, which specifies the listing to update.
 * @returns A Promise that resolves to a NextResponse containing the updated listing data and a success message.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'listing' as ResourceType,
      'manage' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and listing ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const listingId = params.id;

          // Parse the request body
          const data = await validatedReq.json();
          const featured = !!data.featured; // Convert to boolean

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

          // Update the listing's featured status
          const updatedListing = {
            ...existingListing,
            featured,
            updatedAt: new Date().toISOString()
          };

          // Save the updated listing to Redis
          await kv.set(`listing:tenant:${tenantId}:${listingId}`, updatedListing);
          await kv.set(`listing:id:${listingId}`, updatedListing);

          return NextResponse.json({
            listing: updatedListing,
            message: featured
              ? 'Listing has been featured successfully'
              : 'Listing has been unfeatured successfully'
          });
        } catch (error) {
          console.error('Error updating listing featured status:', error);
          return NextResponse.json(
            { error: 'Failed to update listing featured status' },
            { status: 500 }
          );
        }
      }
    )
  );
}
