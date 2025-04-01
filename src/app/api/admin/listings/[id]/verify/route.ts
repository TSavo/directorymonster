import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * POST /api/admin/listings/:id/verify
 *
 * Verifies or unverifies a listing
 * Requires 'manage' permission on 'listing' resource
 *
 * @param req The incoming request
 * @param params Route parameters containing the listing ID
 * @returns Updated listing data with verification status
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
          const verified = !!data.verified; // Convert to boolean

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

          // Update the listing's verification status
          const updatedListing = {
            ...existingListing,
            verified,
            updatedAt: new Date().toISOString()
          };

          // Save the updated listing to Redis
          await kv.set(`listing:tenant:${tenantId}:${listingId}`, updatedListing);
          await kv.set(`listing:id:${listingId}`, updatedListing);

          return NextResponse.json({
            listing: updatedListing,
            message: verified
              ? 'Listing has been verified successfully'
              : 'Listing verification has been removed'
          });
        } catch (error) {
          console.error('Error updating listing verification status:', error);
          return NextResponse.json(
            { error: 'Failed to update listing verification status' },
            { status: 500 }
          );
        }
      }
    )
  );
}
