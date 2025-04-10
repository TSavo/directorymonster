import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getUserRoles, addUserRoles } from '@/lib/user/user-service';
import { getAvailableRoles } from '@/lib/role/role-service';

// Mock the user service functions
jest.mock('@/lib/user/user-service', () => ({
  getUserRoles: jest.fn(),
  addUserRoles: jest.fn()
}));

// Mock the role service functions
jest.mock('@/lib/role/role-service', () => ({
  getAvailableRoles: jest.fn()
}));

// Mock the middleware
jest.mock('@/lib/middleware/withACL', () => ({
  withACL: (handler: any) => handler
}));

jest.mock('@/lib/middleware/withTenant', () => ({
  withTenant: (handler: any) => handler
}));

describe('User Roles API', () => {
  const mockUserId = 'user-123';
  const mockTenantId = 'tenant-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/admin/users/[id]/roles', () => {
    it('returns roles and available roles for a user', async () => {
      // Mock the request
      const req = {
        tenant: { id: mockTenantId }
      } as unknown as NextRequest;
      
      // Mock the service responses
      const mockRoles = [{ id: 'role-1', name: 'Admin' }];
      const mockAvailableRoles = [{ id: 'role-2', name: 'Editor' }];
      
      (getUserRoles as jest.Mock).mockResolvedValue(mockRoles);
      (getAvailableRoles as jest.Mock).mockResolvedValue(mockAvailableRoles);
      
      // Call the handler
      const response = await GET(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        roles: mockRoles,
        availableRoles: mockAvailableRoles
      });
      
      // Check that the service functions were called correctly
      expect(getUserRoles).toHaveBeenCalledWith(mockUserId, mockTenantId);
      expect(getAvailableRoles).toHaveBeenCalledWith(mockUserId, mockTenantId);
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
      (getUserRoles as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Call the handler
      const response = await GET(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch user roles' });
    });
  });
  
  describe('POST /api/admin/users/[id]/roles', () => {
    it('adds roles to a user', async () => {
      // Mock the request
      const mockRoleIds = ['role-1', 'role-2'];
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ roleIds: mockRoleIds })
      } as unknown as NextRequest;
      
      // Mock the service response
      (addUserRoles as jest.Mock).mockResolvedValue(true);
      
      // Call the handler
      const response = await POST(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      
      // Check that the service function was called correctly
      expect(addUserRoles).toHaveBeenCalledWith(mockUserId, mockTenantId, mockRoleIds);
    });
    
    it('returns 404 if tenant is not found', async () => {
      // Mock the request without tenant
      const req = {
        json: jest.fn().mockResolvedValue({ roleIds: ['role-1'] })
      } as unknown as NextRequest;
      
      // Call the handler
      const response = await POST(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Tenant not found' });
    });
    
    it('returns 400 if roleIds is invalid', async () => {
      // Mock the request with invalid roleIds
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ roleIds: 'not-an-array' })
      } as unknown as NextRequest;
      
      // Call the handler
      const response = await POST(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid role IDs format' });
    });
    
    it('returns 400 if roleIds is empty', async () => {
      // Mock the request with empty roleIds
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ roleIds: [] })
      } as unknown as NextRequest;
      
      // Call the handler
      const response = await POST(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid role IDs format' });
    });
    
    it('returns 500 if an error occurs', async () => {
      // Mock the request
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ roleIds: ['role-1'] })
      } as unknown as NextRequest;
      
      // Mock the service to throw an error
      (addUserRoles as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Call the handler
      const response = await POST(req, { params: { id: mockUserId } });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to add roles to user' });
    });
  });
});
