import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';

/**
 * GET handler for login attempts
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response containing login attempts or an error message
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'security' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        // Get query parameters
        const url = new URL(validatedReq.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const status = url.searchParams.getAll('status');
        const ipRiskLevel = url.searchParams.getAll('ipRiskLevel');
        const userId = url.searchParams.get('userId');

        // In a real implementation, you would fetch this data from your database
        // For now, we'll return mock data
        const mockLoginAttempts = [
          {
            id: '1',
            timestamp: '2023-06-01T10:00:00Z',
            username: 'user1',
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            success: true,
            ipRiskLevel: 'low',
            location: {
              country: 'United States',
              city: 'New York',
              latitude: 40.7128,
              longitude: -74.0060
            }
          },
          {
            id: '2',
            timestamp: '2023-06-01T11:00:00Z',
            username: 'user2',
            ip: '192.168.1.2',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
            success: false,
            ipRiskLevel: 'high',
            location: {
              country: 'Canada',
              city: 'Toronto',
              latitude: 43.6532,
              longitude: -79.3832
            }
          },
          {
            id: '3',
            timestamp: '2023-06-01T12:00:00Z',
            username: 'user3',
            ip: '192.168.1.3',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            success: true,
            ipRiskLevel: 'low',
            location: {
              country: 'United Kingdom',
              city: 'London',
              latitude: 51.5074,
              longitude: -0.1278
            }
          },
          {
            id: '4',
            timestamp: '2023-06-01T13:00:00Z',
            username: 'user4',
            ip: '192.168.1.4',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            success: false,
            ipRiskLevel: 'medium',
            location: {
              country: 'Australia',
              city: 'Sydney',
              latitude: -33.8688,
              longitude: 151.2093
            }
          },
          {
            id: '5',
            timestamp: '2023-06-01T14:00:00Z',
            username: 'user5',
            ip: '192.168.1.5',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            success: true,
            ipRiskLevel: 'low',
            location: {
              country: 'Germany',
              city: 'Berlin',
              latitude: 52.5200,
              longitude: 13.4050
            }
          },
          {
            id: '6',
            timestamp: '2023-06-01T15:00:00Z',
            username: 'user1',
            ip: '192.168.1.6',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            success: false,
            ipRiskLevel: 'critical',
            location: {
              country: 'Russia',
              city: 'Moscow',
              latitude: 55.7558,
              longitude: 37.6173
            }
          }
    ];

        // Apply filters
        let filteredAttempts = [...mockLoginAttempts];

        if (status.length > 0) {
          filteredAttempts = filteredAttempts.filter(attempt => {
            if (status.includes('success') && attempt.success) return true;
            if (status.includes('failure') && !attempt.success) return true;
            return false;
          });
        }

        if (ipRiskLevel.length > 0) {
          filteredAttempts = filteredAttempts.filter(attempt =>
            ipRiskLevel.includes(attempt.ipRiskLevel)
          );
        }

        if (userId) {
          filteredAttempts = filteredAttempts.filter(attempt =>
            attempt.username === userId
          );
        }

        // Apply pagination
        const paginatedAttempts = filteredAttempts.slice(offset, offset + limit);
        const hasMore = offset + limit < filteredAttempts.length;

        return NextResponse.json({
          loginAttempts: paginatedAttempts,
          hasMore
        });
      } catch (error) {
        console.error('Error fetching login attempts:', error);
        return NextResponse.json(
          { error: 'Failed to fetch login attempts' },
          { status: 500 }
        );
      }
    }
  );
}
