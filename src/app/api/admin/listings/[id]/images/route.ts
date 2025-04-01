import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * Handles POST requests to add or update images for a listing.
 *
 * This endpoint updates the images of a listing identified by its ID. It expects the JSON body to contain either an
 * `imageUrl` (which appends a new image) or an `images` array (which replaces the existing images). Tenant access and
 * update permission on the listing are validated before processing. The function checks that the listing exists and that
 * it belongs to the requesting tenant, returning a 404 error if either condition fails. On successful update, the
 * listing is saved with a new timestamp and the updated data is returned.
 *
 * @param req - The incoming request containing headers and a JSON payload.
 * @param params - Route parameters including the listing ID.
 * @returns A response containing the updated listing data and a success message, or an error response with an appropriate status code.
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
      'update' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and listing ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const listingId = params.id;

          // Parse the request body
          const data = await validatedReq.json();

          // Validate required fields
          if (!data.imageUrl && !data.images) {
            return NextResponse.json(
              { error: 'Image URL or images array is required' },
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

          // Update the listing's images
          let updatedImages;
          if (data.images) {
            // Replace all images with the provided array
            updatedImages = data.images;
          } else if (data.imageUrl) {
            // Add the new image to the existing images array
            updatedImages = [...(existingListing.images || []), data.imageUrl];
          }

          const updatedListing = {
            ...existingListing,
            images: updatedImages,
            updatedAt: new Date().toISOString()
          };

          // Save the updated listing to Redis
          await kv.set(`listing:tenant:${tenantId}:${listingId}`, updatedListing);
          await kv.set(`listing:id:${listingId}`, updatedListing);

          return NextResponse.json({
            listing: updatedListing,
            message: 'Listing images updated successfully'
          });
        } catch (error) {
          console.error('Error updating listing images:', error);
          return NextResponse.json(
            { error: 'Failed to update listing images' },
            { status: 500 }
          );
        }
      }
    )
  );
}
