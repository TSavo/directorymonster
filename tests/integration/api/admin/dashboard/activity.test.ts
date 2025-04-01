import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/dashboard/activity/route';
import { AuditService } from '@/lib/audit-service';
import { RoleService } from '@/lib/role-service';
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
jest.mock('@/lib/audit-service');
jest.mock('@/lib/role-service');

// JWT secret for testing
const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

describe('Dashboard Activity API', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testUserId = 'user-123';
  const testToken = sign({ userId: testUserId }, JWT_SECRET);
  const mockActivities = [
    {
      id: 'activity-1',
      timestamp: '2023-01-01T12:00:00Z',
      userId: 'user-456',
      action: 'create',
      resourceType: 'listing',
      resourceId: 'listing-123',
      success: true,
      tenantId: testTenantId
    },
    {
      id: 'activity-2',
      timestamp: '2023-01-01T13:00:00Z',
      userId: 'user-789',
      action: 'update',
      resourceType: 'category',
      resourceId: 'category-456',
      success: true,
      tenantId: testTenantId
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock the AuditService.queryEvents method
    (AuditService.queryEvents as jest.Mock).mockResolvedValue(mockActivities);

    // Mock RoleService.hasGlobalRole method
    (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
  });

  // Helper function to create a mock request
  const createMockRequest = (options: {
    tenantId?: string;
    token?: string;
    limit?: number;
    offset?: number;
    entityType?: string;
    actionType?: string;
    userId?: string;
  } = {}) => {
    const url = new URL('https://example.com/api/admin/dashboard/activity');

    if (options.limit) {
      url.searchParams.set('limit', options.limit.toString());
    }
    if (options.offset) {
      url.searchParams.set('offset', options.offset.toString());
    }
    if (options.entityType) {
      url.searchParams.set('entityType', options.entityType);
    }
    if (options.actionType) {
      url.searchParams.set('actionType', options.actionType);
    }
    if (options.userId) {
      url.searchParams.set('userId', options.userId);
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

  it('should return activities when request is valid', async () => {
    // Create a mock request
    const req = createMockRequest();

    // Call the API
    const response = await GET(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({ activities: mockActivities });

    // Verify the service was called with correct parameters
    expect(AuditService.queryEvents).toHaveBeenCalledWith(
      {
        tenantId: testTenantId,
        limit: 10,
        offset: 0,
        resourceType: undefined,
        action: undefined,
        userId: undefined
      },
      testTenantId,
      false
    );
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
    expect(AuditService.queryEvents).not.toHaveBeenCalled();
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
    expect(AuditService.queryEvents).not.toHaveBeenCalled();
  });

  it('should respect query parameters for filtering', async () => {
    // Create a mock request with filters
    const req = createMockRequest({
      limit: 20,
      offset: 5,
      entityType: 'listing',
      actionType: 'create',
      userId: 'user-456'
    });

    // Call the API
    await GET(req);

    // Verify the service was called with correct parameters
    expect(AuditService.queryEvents).toHaveBeenCalledWith(
      {
        tenantId: testTenantId,
        limit: 20,
        offset: 5,
        resourceType: 'listing',
        action: 'create',
        userId: 'user-456'
      },
      testTenantId,
      false
    );
  });

  it('should allow global admins to see cross-tenant events', async () => {
    // Mock global admin check to return true
    (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(true);

    // Create a mock request
    const req = createMockRequest();

    // Call the API
    await GET(req);

    // Verify the service was called with undefined tenantId for cross-tenant query
    expect(AuditService.queryEvents).toHaveBeenCalledWith(
      {
        tenantId: undefined, // Should be undefined for global admins
        limit: 10,
        offset: 0,
        resourceType: undefined,
        action: undefined,
        userId: undefined
      },
      testTenantId,
      true
    );
  });

  it('should handle service errors gracefully', async () => {
    // Mock service to throw error
    (AuditService.queryEvents as jest.Mock).mockRejectedValue(new Error('Service error'));

    // Create a mock request
    const req = createMockRequest();

    // Call the API
    const response = await GET(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to retrieve dashboard activity');
  });
});
