import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * POST /api/admin/listings/:id/images
 *
 * Adds or updates images for a listing
 * Requires 'update' permission on 'listing' resource
 *
 * @param req The incoming request
 * @param params Route parameters containing the listing ID
 * @returns Updated listing data with images
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
