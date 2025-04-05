import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const status = url.searchParams.getAll('status');
    const ipRiskLevel = url.searchParams.getAll('ipRiskLevel');
    const userId = url.searchParams.get('userId');

    // In a real implementation, you would fetch this data from your database
    // For now, we'll return mock data
    const mockMapData = [
      {
        id: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        count: 15,
        successCount: 10,
        failedCount: 5,
        ipRiskLevel: 'low',
        location: 'New York, United States'
      },
      {
        id: '2',
        latitude: 43.6532,
        longitude: -79.3832,
        count: 8,
        successCount: 3,
        failedCount: 5,
        ipRiskLevel: 'high',
        location: 'Toronto, Canada'
      },
      {
        id: '3',
        latitude: 51.5074,
        longitude: -0.1278,
        count: 12,
        successCount: 9,
        failedCount: 3,
        ipRiskLevel: 'low',
        location: 'London, United Kingdom'
      },
      {
        id: '4',
        latitude: -33.8688,
        longitude: 151.2093,
        count: 6,
        successCount: 4,
        failedCount: 2,
        ipRiskLevel: 'medium',
        location: 'Sydney, Australia'
      },
      {
        id: '5',
        latitude: 52.5200,
        longitude: 13.4050,
        count: 9,
        successCount: 7,
        failedCount: 2,
        ipRiskLevel: 'low',
        location: 'Berlin, Germany'
      },
      {
        id: '6',
        latitude: 55.7558,
        longitude: 37.6173,
        count: 4,
        successCount: 1,
        failedCount: 3,
        ipRiskLevel: 'critical',
        location: 'Moscow, Russia'
      },
      {
        id: '7',
        latitude: 35.6762,
        longitude: 139.6503,
        count: 7,
        successCount: 5,
        failedCount: 2,
        ipRiskLevel: 'medium',
        location: 'Tokyo, Japan'
      },
      {
        id: '8',
        latitude: 22.3193,
        longitude: 114.1694,
        count: 5,
        successCount: 3,
        failedCount: 2,
        ipRiskLevel: 'high',
        location: 'Hong Kong'
      }
    ];

    // Apply filters
    let filteredMapData = [...mockMapData];

    if (ipRiskLevel.length > 0) {
      filteredMapData = filteredMapData.filter(point => 
        ipRiskLevel.includes(point.ipRiskLevel)
      );
    }

    return NextResponse.json({ mapData: filteredMapData });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
});
