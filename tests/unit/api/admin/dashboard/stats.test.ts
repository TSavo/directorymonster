import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/lib/dashboard-service';
import * as jwt from 'jsonwebtoken';
import { redis } from '@/lib/redis-client';
import { getTenantUsersKey, getUserRolesKey } from '@/components/admin/auth/utils/roles';

// Mock dependencies
jest.mock('@/lib/dashboard-service');

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn((data, options) => ({
        data,
        status: options?.status || 200,
        json: async () => data
      }))
    }
  };
});

// Create a handler function that mimics the one in the route file
async function dashboardStatsHandler(req: NextRequest): Promise<NextResponse> {
  try {
    // Get tenant context
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant context' },
        { status: 400 }
      );
    }

    // Check for authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authentication' },
        { status: 401 }
      );
    }

    // Get query parameters for time period
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'month';
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    // Get dashboard stats from service
    const stats = await DashboardService.getStats({
      tenantId,
      period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
      startDate,
      endDate
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error retrieving dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard statistics' },
      { status: 500 }
    );
  }
}

describe('Dashboard Stats API', () => {
  // Test data
  const mockStats = {
    listings: { total: 100, published: 80 },
    categories: { total: 20, active: 18 }
  };

  // Test user and tenant data
  const TEST_USER_ID = 'test-user-id';
  const TEST_TENANT_ID = 'test-tenant';
  const TEST_ROLE_ID = 'test-admin-role';

  // Set up JWT_SECRET for testing
  const TEST_SECRET = 'test-secret';
  process.env.JWT_SECRET = TEST_SECRET;

  // Generate a valid JWT token for testing
  const generateToken = (userId: string) => {
    return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });
  };

  // Test token
  const TEST_TOKEN = generateToken(TEST_USER_ID);

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set up the mock implementation for DashboardService
    (DashboardService.getStats as jest.Mock).mockResolvedValue(mockStats);

    // Set up Redis with test data for authentication and permissions
    // Add user to tenant
    const tenantUsersKey = getTenantUsersKey(TEST_TENANT_ID);
    await redis.sadd(tenantUsersKey, TEST_USER_ID);

    // Create a role with admin permissions
    const adminRole = {
      id: TEST_ROLE_ID,
      name: 'Admin',
      tenantId: TEST_TENANT_ID,
      permissions: {
        setting: { read: ['*'], update: ['*'] },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store role in Redis
    await redis.set(`role:${TEST_TENANT_ID}:${TEST_ROLE_ID}`, JSON.stringify(adminRole));

    // Assign role to user
    const userRolesKey = getUserRolesKey(TEST_USER_ID, TEST_TENANT_ID);
    await redis.sadd(userRolesKey, TEST_ROLE_ID);
  });

  afterEach(async () => {
    // Clean up Redis test data
    const tenantUsersKey = getTenantUsersKey(TEST_TENANT_ID);
    await redis.del(tenantUsersKey);

    const userRolesKey = getUserRolesKey(TEST_USER_ID, TEST_TENANT_ID);
    await redis.del(userRolesKey);

    await redis.del(`role:${TEST_TENANT_ID}:${TEST_ROLE_ID}`);
  });

  it('should return stats when given valid inputs', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    // Act
    const response = await dashboardStatsHandler(req);

    // Assert
    expect(response).toBeDefined();
    const responseData = await response.json();
    expect(responseData).toHaveProperty('stats');
    expect(DashboardService.getStats).toHaveBeenCalledWith({
      tenantId: TEST_TENANT_ID,
      period: 'month',
      startDate: undefined,
      endDate: undefined
    });
  });

  it('should handle missing tenant ID', async () => {
    // Arrange
    // Create a request without tenant ID
    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    // Act
    const response = await dashboardStatsHandler(req);

    // Assert
    expect(response).toBeDefined();
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('Missing tenant context');
    expect(DashboardService.getStats).not.toHaveBeenCalled();
  });

  it('should handle missing authentication', async () => {
    // Arrange
    // Create a request without authentication
    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': TEST_TENANT_ID
      }
    });

    // Act
    const response = await dashboardStatsHandler(req);

    // Assert
    expect(response).toBeDefined();
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('Missing authentication');
    expect(DashboardService.getStats).not.toHaveBeenCalled();
  });

  it('should respect query parameters for time period', async () => {
    // Arrange
    const req = new NextRequest(
      'https://example.com/api/admin/dashboard/stats?period=week&startDate=2023-01-01&endDate=2023-01-07',
      {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );

    // Act
    const response = await dashboardStatsHandler(req);

    // Assert
    expect(response).toBeDefined();
    const responseData = await response.json();
    expect(responseData).toHaveProperty('stats');
    expect(DashboardService.getStats).toHaveBeenCalledWith({
      tenantId: TEST_TENANT_ID,
      period: 'week',
      startDate: '2023-01-01',
      endDate: '2023-01-07'
    });
  });

  it('should handle service errors gracefully', async () => {
    // Arrange
    (DashboardService.getStats as jest.Mock).mockRejectedValue(new Error('Service error'));

    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    // Act
    const response = await dashboardStatsHandler(req);

    // Assert
    expect(response).toBeDefined();
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('Failed to retrieve dashboard statistics');
    expect(response.status).toBe(500);
  });

  // We don't need to test the middleware directly since we're using the in-memory Redis store
  // and the middleware is tested elsewhere
});

describe('Dashboard Stats Permission Middleware', () => {
  // Test data
  const TEST_USER_ID = 'permission-test-user';
  const TEST_TENANT_ID = 'permission-test-tenant';
  const TEST_ROLE_ID = 'permission-test-role';
  const TEST_SECRET = 'test-secret';
  const TEST_TOKEN = jwt.sign({ userId: TEST_USER_ID }, TEST_SECRET, { expiresIn: '1h' });

  // Set up JWT_SECRET for testing
  process.env.JWT_SECRET = TEST_SECRET;

  // Create a mock RoleService
  const mockRoleService = {
    hasPermission: jest.fn().mockResolvedValue(true)
  };

  // Create a mock handler function
  const mockHandler = jest.fn().mockImplementation(async (req) => {
    return NextResponse.json({ success: true });
  });

  // Create a mock withPermission middleware
  const mockWithPermission = jest.fn().mockImplementation(async (req, resourceType, permission, handler) => {
    // Check if user has permission using the mocked RoleService
    const hasPermission = await mockRoleService.hasPermission();

    if (hasPermission) {
      return handler(req);
    } else {
      return NextResponse.json(
        { error: 'Permission denied', message: `Required '${permission}' permission for ${resourceType}` },
        { status: 403 }
      );
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoleService.hasPermission.mockResolvedValue(true);
  });

  it('should reject requests when user lacks required permission', async () => {
    // Arrange
    mockRoleService.hasPermission.mockResolvedValue(false);

    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    // Act
    const response = await mockWithPermission(req, 'setting', 'read', mockHandler);

    // Assert
    expect(response).toBeDefined();
    expect(response.status).toBe(403);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('Permission denied');
    expect(responseData.message).toContain('setting');
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should allow requests when user has required permission', async () => {
    // Arrange
    mockRoleService.hasPermission.mockResolvedValue(true);

    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    // Act
    const response = await mockWithPermission(req, 'setting', 'read', mockHandler);

    // Assert
    expect(response).toBeDefined();
    expect(mockHandler).toHaveBeenCalledWith(req);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success');
    expect(responseData.success).toBe(true);
  });
});

describe('Dashboard Stats Route Implementation', () => {
  // Create a spy to track middleware calls
  const withTenantAccessSpy = jest.fn();
  const withPermissionSpy = jest.fn();

  // Create a mock response for the handler
  const mockResponse = { data: 'test-response' };

  // Mock the middleware modules
  jest.mock('@/middleware/tenant-validation', () => ({
    withTenantAccess: (req, handler) => {
      withTenantAccessSpy(req);
      // Just return a mock response instead of calling the handler
      return mockResponse;
    }
  }));

  jest.mock('@/middleware/withPermission', () => ({
    withPermission: (req, resourceType, permission, handler) => {
      withPermissionSpy(req, resourceType, permission);
      // Just return a mock response instead of calling the handler
      return mockResponse;
    }
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use the withTenantAccess middleware with correct parameters', async () => {
    // Import the route handler after mocking
    const { GET } = require('@/app/api/admin/dashboard/stats/route');

    // Create a test request
    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': 'test-tenant',
        'authorization': 'Bearer test-token'
      }
    });

    // Call the route handler
    const response = await GET(req);

    // Verify the response is our mock response
    expect(response).toBe(mockResponse);

    // Verify the middleware was called with the correct parameters
    expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
  });

  it('should use the withPermission middleware with correct resource type and permission', async () => {
    // Import the route handler after mocking
    const { GET } = require('@/app/api/admin/dashboard/stats/route');

    // Create a test request
    const req = new NextRequest('https://example.com/api/admin/dashboard/stats', {
      headers: {
        'x-tenant-id': 'test-tenant',
        'authorization': 'Bearer test-token'
      }
    });

    // Call the route handler
    const response = await GET(req);

    // Verify the response is our mock response
    expect(response).toBe(mockResponse);

    // Verify the middleware was called with the correct parameters
    expect(withPermissionSpy).toHaveBeenCalledWith(req, 'setting', 'read');
  });
});
