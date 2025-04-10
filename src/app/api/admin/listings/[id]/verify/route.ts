import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { kv } from '@/lib/redis-client';

/**
 * Handles the verification update of a listing.
 *
 * This endpoint processes a request to verify or unverify a listing. It extracts the tenant ID from the request headers
 * and the listing ID from the route parameters, then checks that the listing exists and belongs to the specified tenant.
 * If valid, it updates the listing's verification status and timestamp, returning a JSON response with the updated listing
 * and a message indicating whether the listing has been verified or the verification has been removed.
 * A 404 response is returned if the listing is not found or does not belong to the tenant, while a 500 response is returned
 * if an error occurs during the update process.
 *
 * @param req - The incoming API request.
 * @param params - An object containing the listing ID from the route parameters.
 * @returns A JSON response with the updated listing data and a verification status message.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'listing' as ResourceType,
    'verify' as Permission,
    async (validatedReq, context) => {
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
    },
    params.id // Pass the resource ID for specific permission check
  );
}
