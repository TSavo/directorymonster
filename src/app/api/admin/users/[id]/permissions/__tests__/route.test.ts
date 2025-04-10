import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getUserEffectivePermissions } from '@/lib/user/user-service';

// Mock the user service functions
jest.mock('@/lib/user/user-service', () => ({
  getUserEffectivePermissions: jest.fn()
}));

// Mock the middleware
jest.mock('@/lib/middleware/withACL', () => ({
  withACL: (handler: any) => handler
}));

jest.mock('@/lib/middleware/withTenant', () => ({
  withTenant: (handler: any) => handler
}));

describe('User Permissions API', () => {
  const mockUserId = 'user-123';
  const mockTenantId = 'tenant-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/admin/users/[id]/permissions', () => {
    it('returns effective permissions for a user', async () => {
      // Mock the request
      const req = {
        tenant: { id: mockTenantId }
      } as unknown as NextRequest;
      
      // Mock the service response
      const mockEffectivePermissions = {
        'user': [
          { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
        ],
        'role': [
          { resource: 'role', actions: ['read'] }
        ]
      };
      
      const mockPermissionSources = {
        'user-create': ['Admin'],
        'user-read': ['Admin'],
        'user-update': ['Admin'],
        'user-delete': ['Admin'],
        'role-read': ['Admin']
      };
      
      (getUserEffectivePermissions as jest.Mock).mockResolvedValue({
        effectivePermissions: mockEffectivePermissions,
        permissionSources: mockPermissionSources
      });
      
      // Call the handler
      const response = await GET(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        effectivePermissions: mockEffectivePermissions,
        permissionSources: mockPermissionSources
      });
      
      // Check that the service function was called correctly
      expect(getUserEffectivePermissions).toHaveBeenCalledWith(mockUserId, mockTenantId);
    });
    
    it('returns 404 if tenant is not found', async () => {
      // Mock the request without tenant
      const req = {} as NextRequest;
      
      // Call the handler
      const response = await GET(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Tenant not found' });
    });
    
    it('returns 500 if an error occurs', async () => {
      // Mock the request
      const req = {
        tenant: { id: mockTenantId }
      } as unknown as NextRequest;
      
      // Mock the service to throw an error
      (getUserEffectivePermissions as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Call the handler
      const response = await GET(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch user permissions' });
    });
  });
});
