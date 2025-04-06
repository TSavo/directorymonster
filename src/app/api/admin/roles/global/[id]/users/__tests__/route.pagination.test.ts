import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';
import { RoleService } from '@/lib/role';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';

// Mock the RoleService
jest.mock('@/lib/role', () => ({
  RoleService: {
    getGlobalRole: jest.fn(),
    getUsersWithGlobalRole: jest.fn()
  }
}));

// Mock the withSecureTenantPermission middleware
jest.mock('@/app/api/middleware/secureTenantContext', () => ({
  withSecureTenantPermission: jest.fn()
}));

describe('GET /api/admin/roles/global/[id]/users with pagination', () => {
  const mockRoleId = 'global-role-123';
  const mockUsers = Array.from({ length: 50 }, (_, i) => `user-${i + 1}`);

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the withSecureTenantPermission middleware to execute the handler
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => handler(req, { userId: 'user-1', tenantId: 'tenant-1' })
    );

    // Mock the getGlobalRole method
    (RoleService.getGlobalRole as jest.Mock).mockResolvedValue({
      id: mockRoleId,
      name: 'Global Admin',
      isGlobal: true
    });
  });

  it('should return all users when no pagination parameters are provided', async () => {
    // Mock the getUsersWithGlobalRole method to return all users
    (RoleService.getUsersWithGlobalRole as jest.Mock).mockResolvedValue(mockUsers);

    // Create a mock request
    const req = new NextRequest('http://localhost/api/admin/roles/global/role-123/users');

    // Call the handler
    const response = await GET(req, { params: { id: mockRoleId } });
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({ users: mockUsers });

    // Verify the service was called with undefined pagination parameters
    expect(RoleService.getUsersWithGlobalRole).toHaveBeenCalledWith(mockRoleId, undefined, undefined);
  });

  it('should return paginated users when pagination parameters are provided', async () => {
    // Mock the getUsersWithGlobalRole method to return paginated users
    (RoleService.getUsersWithGlobalRole as jest.Mock).mockResolvedValue({
      users: mockUsers.slice(10, 20),
      total: mockUsers.length
    });

    // Create a mock request with pagination parameters
    const req = new NextRequest('http://localhost/api/admin/roles/global/role-123/users?page=2&pageSize=10');

    // Call the handler
    const response = await GET(req, { params: { id: mockRoleId } });
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      users: mockUsers.slice(10, 20),
      pagination: {
        page: 2,
        pageSize: 10,
        total: mockUsers.length,
        totalPages: 5
      }
    });

    // Verify the service was called with pagination parameters
    expect(RoleService.getUsersWithGlobalRole).toHaveBeenCalledWith(mockRoleId, 2, 10);
  });

  it('should handle invalid pagination parameters', async () => {
    // Create a mock request with invalid pagination parameters
    const req = new NextRequest('http://localhost/api/admin/roles/global/role-123/users?page=invalid&pageSize=10');

    // Call the handler
    const response = await GET(req, { params: { id: mockRoleId } });
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid pagination parameters' });

    // Verify the service was not called
    expect(RoleService.getUsersWithGlobalRole).not.toHaveBeenCalled();
  });
});
