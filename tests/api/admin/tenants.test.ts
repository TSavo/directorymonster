/**
 * Tests for the GET /api/admin/tenants endpoint
 * 
 * This test suite verifies that the endpoint correctly returns a list of tenants
 * with proper filtering, sorting, pagination, and security controls.
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Mock services
jest.mock('../../../src/lib/tenant-service', () => ({
  __esModule: true,
  default: {
    getAllTenants: jest.fn(),
    getTenantById: jest.fn()
  },
  TenantService: {
    getAllTenants: jest.fn(),
    getTenantById: jest.fn()
  }
}));

jest.mock('../../../src/lib/role-service', () => ({
  __esModule: true,
  default: {
    hasPermission: jest.fn(),
    hasRoleInTenant: jest.fn()
  }
}));

jest.mock('../../../src/lib/tenant-membership-service', () => ({
  __esModule: true,
  default: {
    isTenantMember: jest.fn()
  }
}));

// Create NextResponse.json mock
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, opts) => ({
        status: opts?.status || 200,
        body,
        headers: new Map()
      }))
    }
  };
});

// Import services and handler after mocking
import TenantService from '@/lib/tenant-service';
import RoleService from '@/lib/role-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { GET } from '@/app/api/admin/tenants/route';

// Test data
const JWT_SECRET = 'test-jwt-secret';
const superAdminId = 'super-admin-123';
const regularAdminId = 'admin-456';
const systemTenantId = 'system';

// Mock tenant data
const mockTenants = [
  {
    id: 'tenant_1234567890',
    name: 'Fishing Gear Directory',
    slug: 'fishing-gear',
    primaryDomain: 'fishinggearreviews.com',
    status: 'active',
    subscriptionType: 'professional',
    subscriptionRenewsAt: '2025-12-31T23:59:59Z',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-20T14:45:30Z',
    owner: {
      id: 'user_1234567890',
      name: 'John Smith',
      email: 'john@fishinggearreviews.com'
    },
    contactEmail: 'admin@fishinggearreviews.com',
    contactPhone: '+1-555-123-4567',
    billingEmail: 'billing@fishinggearreviews.com',
    stats: {
      siteCount: 3,
      userCount: 12,
      listingCount: 547,
      categoryCount: 45,
      submissionCount: 78,
      pendingSubmissions: 15,
      storageUsed: 2.4,
      apiRequestsLastMonth: 12450
    }
  },
  {
    id: 'tenant_0987654321',
    name: 'Camping Equipment Reviews',
    slug: 'camping-equipment',
    primaryDomain: 'campingequipmentreviews.com',
    status: 'trial',
    subscriptionType: 'basic',
    trialEndsAt: '2024-05-15T23:59:59Z',
    createdAt: '2024-04-01T08:15:00Z',
    updatedAt: '2024-04-01T08:15:00Z',
    owner: {
      id: 'user_0987654321',
      name: 'Jane Doe',
      email: 'jane@campingequipmentreviews.com'
    },
    contactEmail: 'info@campingequipmentreviews.com',
    contactPhone: '+1-555-987-6543',
    billingEmail: 'jane@campingequipmentreviews.com',
    stats: {
      siteCount: 1,
      userCount: 3,
      listingCount: 42,
      categoryCount: 8,
      submissionCount: 12,
      pendingSubmissions: 5,
      storageUsed: 0.3,
      apiRequestsLastMonth: 450
    }
  },
  {
    id: 'tenant_5678901234',
    name: 'Hiking Gear Reviews',
    slug: 'hiking-gear',
    primaryDomain: 'hikinggearreviews.com',
    status: 'active',
    subscriptionType: 'enterprise',
    subscriptionRenewsAt: '2026-01-15T23:59:59Z',
    createdAt: '2023-10-10T14:20:00Z',
    updatedAt: '2024-02-15T11:30:00Z',
    owner: {
      id: 'user_5678901234',
      name: 'Robert Johnson',
      email: 'robert@hikinggearreviews.com'
    },
    contactEmail: 'admin@hikinggearreviews.com',
    contactPhone: '+1-555-456-7890',
    billingEmail: 'finance@hikinggearreviews.com',
    stats: {
      siteCount: 5,
      userCount: 20,
      listingCount: 850,
      categoryCount: 60,
      submissionCount: 120,
      pendingSubmissions: 25,
      storageUsed: 5.8,
      apiRequestsLastMonth: 28500
    }
  }
];

// Setup environment
process.env.JWT_SECRET = JWT_SECRET;

describe('GET /api/admin/tenants', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Default mock implementation for TenantService
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue(mockTenants);
    
    // Default mock implementation for RoleService
    (RoleService.hasPermission as jest.Mock).mockImplementation(
      (userId, tenantId, resourceType, permission) => {
        // Super admin has all permissions in system tenant
        if (userId === superAdminId && tenantId === systemTenantId) {
          return Promise.resolve(true);
        }
        // Regular admin doesn't have tenant management permissions
        return Promise.resolve(false);
      }
    );
    
    (RoleService.hasRoleInTenant as jest.Mock).mockImplementation(
      (userId, tenantId) => {
        // Super admin has role in system tenant
        if (userId === superAdminId && tenantId === systemTenantId) {
          return Promise.resolve(true);
        }
        // Regular admin has role in system tenant but not tenant management permissions
        if (userId === regularAdminId && tenantId === systemTenantId) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }
    );
    
    // Default mock implementation for TenantMembershipService
    (TenantMembershipService.isTenantMember as jest.Mock).mockImplementation(
      (userId, tenantId) => {
        // Super admin is a member of system tenant
        if (userId === superAdminId && tenantId === systemTenantId) {
          return Promise.resolve(true);
        }
        // Regular admin is a member of system tenant
        if (userId === regularAdminId && tenantId === systemTenantId) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }
    );
    
    // Reset NextResponse.json mock
    (NextResponse.json as jest.Mock).mockImplementation((body, opts) => ({
      status: opts?.status || 200,
      body,
      headers: new Map()
    }));
  });
  
  // Create a valid JWT token for testing
  const createToken = (userId: string, expiresIn = '1h') => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
  };
  
  // Create a Next.js request with specified headers and query parameters
  const createNextRequest = (
    method: string = 'GET',
    url: string = 'http://example.com/api/admin/tenants',
    headers: Record<string, string> = {},
    searchParams: Record<string, string> = {}
  ): NextRequest => {
    const headersObj = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
      headersObj.set(key, value);
    });
    
    const urlObj = new URL(url);
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    
    return {
      method,
      url: urlObj.toString(),
      headers: headersObj,
      nextUrl: urlObj
    } as unknown as NextRequest;
  };
  
  /**
   * Test: Super admin can retrieve all tenants
   */
  test('should return all tenants for super admin', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with system tenant headers
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    });
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called
    expect(TenantService.getAllTenants).toHaveBeenCalled();
    
    // Check that the response contains the expected data
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tenants: mockTenants,
      pagination: {
        total: mockTenants.length,
        page: 1,
        limit: 20,
        pages: 1
      },
      stats: {
        active: 2,
        suspended: 0,
        trial: 1,
        archived: 0,
        totalTenants: mockTenants.length
      }
    });
  });
  
  /**
   * Test: Regular admin cannot access tenant list
   */
  test('should deny access to regular admin without tenant management permission', async () => {
    // Create a valid token for regular admin
    const token = createToken(regularAdminId);
    
    // Create a Next.js request with system tenant headers
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    });
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that the response is a 403 Forbidden
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Insufficient permissions to access tenant information'
    });
    
    // Check that TenantService.getAllTenants was not called
    expect(TenantService.getAllTenants).not.toHaveBeenCalled();
  });
  
  /**
   * Test: Unauthenticated request is rejected
   */
  test('should return 401 for unauthenticated request', async () => {
    // Create a Next.js request without auth token
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'x-tenant-id': systemTenantId
    });
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that the response is a 401 Unauthorized
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required'
    });
    
    // Check that TenantService.getAllTenants was not called
    expect(TenantService.getAllTenants).not.toHaveBeenCalled();
  });
  
  /**
   * Test: Filtering by status
   */
  test('should filter tenants by status', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with status filter
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'status': 'active'
    });
    
    // Mock filtered tenants
    const filteredTenants = mockTenants.filter(tenant => tenant.status === 'active');
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue(filteredTenants);
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called with correct filter
    expect(TenantService.getAllTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active'
      })
    );
    
    // Check that the response contains only active tenants
    expect(response.status).toBe(200);
    expect(response.body.tenants.length).toBe(2);
    expect(response.body.tenants.every((tenant: any) => tenant.status === 'active')).toBe(true);
    expect(response.body.stats.active).toBe(2);
    expect(response.body.stats.totalTenants).toBe(2);
  });
  
  /**
   * Test: Filtering by subscription type
   */
  test('should filter tenants by subscription type', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with subscription type filter
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'subscriptionType': 'professional'
    });
    
    // Mock filtered tenants
    const filteredTenants = mockTenants.filter(tenant => tenant.subscriptionType === 'professional');
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue(filteredTenants);
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called with correct filter
    expect(TenantService.getAllTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionType: 'professional'
      })
    );
    
    // Check that the response contains only professional subscription tenants
    expect(response.status).toBe(200);
    expect(response.body.tenants.length).toBe(1);
    expect(response.body.tenants.every((tenant: any) => tenant.subscriptionType === 'professional')).toBe(true);
  });
  
  /**
   * Test: Filtering by date range
   */
  test('should filter tenants by date range', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with date range filter
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'fromDate': '2024-01-01T00:00:00Z',
      'toDate': '2024-04-01T00:00:00Z'
    });
    
    // Mock filtered tenants
    const filteredTenants = mockTenants.filter(tenant => {
      const createdAt = new Date(tenant.createdAt);
      return createdAt >= new Date('2024-01-01T00:00:00Z') && createdAt <= new Date('2024-04-01T00:00:00Z');
    });
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue(filteredTenants);
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called with correct filter
    expect(TenantService.getAllTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-04-01T00:00:00Z'
      })
    );
    
    // Check that the response contains tenants within the date range
    expect(response.status).toBe(200);
    expect(response.body.tenants.length).toBe(2);
  });
  
  /**
   * Test: Search functionality
   */
  test('should search tenants by name or domain', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with search parameter
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'search': 'fishing'
    });
    
    // Mock filtered tenants
    const filteredTenants = mockTenants.filter(tenant => 
      tenant.name.toLowerCase().includes('fishing') || 
      tenant.primaryDomain.toLowerCase().includes('fishing')
    );
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue(filteredTenants);
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called with correct filter
    expect(TenantService.getAllTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'fishing'
      })
    );
    
    // Check that the response contains matching tenants
    expect(response.status).toBe(200);
    expect(response.body.tenants.length).toBe(1);
    expect(response.body.tenants[0].name).toBe('Fishing Gear Directory');
  });
  
  /**
   * Test: Pagination
   */
  test('should paginate results', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with pagination parameters
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'page': '2',
      'limit': '1'
    });
    
    // Mock paginated tenants (second page with limit of 1)
    const paginatedTenants = [mockTenants[1]];
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue({
      tenants: paginatedTenants,
      total: mockTenants.length
    });
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called with correct pagination
    expect(TenantService.getAllTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 1
      })
    );
    
    // Check that the response contains paginated results
    expect(response.status).toBe(200);
    expect(response.body.tenants.length).toBe(1);
    expect(response.body.tenants[0].id).toBe('tenant_0987654321');
    expect(response.body.pagination).toEqual({
      total: mockTenants.length,
      page: 2,
      limit: 1,
      pages: 3
    });
  });
  
  /**
   * Test: Sorting
   */
  test('should sort results', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with sorting parameters
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'sort': 'name',
      'order': 'asc'
    });
    
    // Mock sorted tenants
    const sortedTenants = [...mockTenants].sort((a, b) => a.name.localeCompare(b.name));
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue(sortedTenants);
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that TenantService.getAllTenants was called with correct sorting
    expect(TenantService.getAllTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'name',
        order: 'asc'
      })
    );
    
    // Check that the response contains sorted results
    expect(response.status).toBe(200);
    expect(response.body.tenants[0].name).toBe('Camping Equipment Reviews');
    expect(response.body.tenants[1].name).toBe('Fishing Gear Directory');
    expect(response.body.tenants[2].name).toBe('Hiking Gear Reviews');
  });
  
  /**
   * Test: Server error handling
   */
  test('should handle server errors', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    });
    
    // Mock TenantService.getAllTenants to throw an error
    (TenantService.getAllTenants as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that the response is a 500 Internal Server Error
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to retrieve tenants'
    });
  });
  
  /**
   * Test: Empty result set
   */
  test('should handle empty result set', async () => {
    // Create a valid token for super admin
    const token = createToken(superAdminId);
    
    // Create a Next.js request with filter that returns no results
    const req = createNextRequest('GET', 'http://example.com/api/admin/tenants', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': systemTenantId
    }, {
      'status': 'nonexistent'
    });
    
    // Mock empty tenants array
    (TenantService.getAllTenants as jest.Mock).mockResolvedValue([]);
    
    // Call the handler with our request
    const response = await GET(req);
    
    // Check that the response contains empty tenants array with proper pagination and stats
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tenants: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
      },
      stats: {
        active: 0,
        suspended: 0,
        trial: 0,
        archived: 0,
        totalTenants: 0
      }
    });
  });
});