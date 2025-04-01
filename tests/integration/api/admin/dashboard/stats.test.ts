import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/dashboard/stats/route';
import { DashboardService } from '@/lib/dashboard-service';
import { sign } from 'jsonwebtoken';

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn((data, options) => {
        return {
          status: options?.status || 200,
          json: async () => data,
          headers: new Map()
        };
      })
    }
  };
});

// Mock the dependencies
jest.mock('@/lib/dashboard-service');

// JWT secret for testing
const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

describe('Dashboard Stats API', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testUserId = 'user-123';
  const testToken = sign({ userId: testUserId }, JWT_SECRET);
  const mockStats = {
    listings: { total: 100, published: 80 },
    categories: { total: 20, active: 18 },
    traffic: { pageViews: 5000, uniqueVisitors: 1200 }
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock the DashboardService.getStats method
    (DashboardService.getStats as jest.Mock).mockResolvedValue(mockStats);
  });

  // Helper function to create a mock request
  const createMockRequest = (options: {
    tenantId?: string;
    token?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const url = new URL('https://example.com/api/admin/dashboard/stats');

    if (options.period) {
      url.searchParams.set('period', options.period);
    }
    if (options.startDate) {
      url.searchParams.set('startDate', options.startDate);
    }
    if (options.endDate) {
      url.searchParams.set('endDate', options.endDate);
    }

    const headers = new Headers();
    if (options.tenantId !== undefined) {
      headers.set('x-tenant-id', options.tenantId);
    } else {
      headers.set('x-tenant-id', testTenantId);
    }

    if (options.token !== undefined) {
      headers.set('authorization', `Bearer ${options.token}`);
    } else {
      headers.set('authorization', `Bearer ${testToken}`);
    }

    return new NextRequest(url, { headers });
  };

  it('should return stats when request is valid', async () => {
    // Create a mock request
    const req = createMockRequest();

    // Call the API
    const response = await GET(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({ stats: mockStats });

    // Verify the service was called with correct parameters
    expect(DashboardService.getStats).toHaveBeenCalledWith({
      tenantId: testTenantId,
      period: 'month',
      startDate: undefined,
      endDate: undefined
    });
  });

  it('should return 400 when no tenant ID is provided', async () => {
    // Create a mock request without tenant ID
    const req = createMockRequest({ tenantId: '' });

    // Call the API
    const response = await GET(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing tenant context');

    // Verify the service was not called
    expect(DashboardService.getStats).not.toHaveBeenCalled();
  });

  it('should return 401 when no auth token is provided', async () => {
    // Create a mock request without auth token
    const req = createMockRequest({ token: '' });

    // Call the API
    const response = await GET(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing authentication');

    // Verify the service was not called
    expect(DashboardService.getStats).not.toHaveBeenCalled();
  });

  it('should respect query parameters for time period', async () => {
    // Create a mock request with custom period
    const req = createMockRequest({
      period: 'week',
      startDate: '2023-01-01',
      endDate: '2023-01-07'
    });

    // Call the API
    await GET(req);

    // Verify the service was called with correct parameters
    expect(DashboardService.getStats).toHaveBeenCalledWith({
      tenantId: testTenantId,
      period: 'week',
      startDate: '2023-01-01',
      endDate: '2023-01-07'
    });
  });

  it('should handle service errors gracefully', async () => {
    // Mock service to throw error
    (DashboardService.getStats as jest.Mock).mockRejectedValue(new Error('Service error'));

    // Create a mock request
    const req = createMockRequest();

    // Call the API
    const response = await GET(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to retrieve dashboard statistics');
  });
});
