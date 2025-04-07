import { NextRequest } from 'next/server';
import { POST } from '../route';
import { comparePermissions } from '@/lib/role/role-service';

// Mock the role service functions
jest.mock('@/lib/role/role-service', () => ({
  comparePermissions: jest.fn()
}));

// Mock the middleware
jest.mock('@/lib/middleware/withACL', () => ({
  withACL: (handler: any) => handler
}));

jest.mock('@/lib/middleware/withTenant', () => ({
  withTenant: (handler: any) => handler
}));

describe('Permission Comparison API', () => {
  const mockTenantId = 'tenant-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/admin/permissions/compare', () => {
    it('compares permissions between roles', async () => {
      // Mock the request
      const mockType = 'roles';
      const mockIds = ['role-1', 'role-2'];
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ type: mockType, ids: mockIds })
      } as unknown as NextRequest;
      
      // Mock the service response
      const mockComparisonResults = {
        'user': {
          'create': { 'Admin': true, 'Editor': false }
        },
        'role': {
          'read': { 'Admin': true, 'Editor': true }
        }
      };
      
      (comparePermissions as jest.Mock).mockResolvedValue(mockComparisonResults);
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual(mockComparisonResults);
      
      // Check that the service function was called correctly
      expect(comparePermissions).toHaveBeenCalledWith(mockType, mockIds, mockTenantId);
    });
    
    it('compares permissions between users', async () => {
      // Mock the request
      const mockType = 'users';
      const mockIds = ['user-1', 'user-2'];
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ type: mockType, ids: mockIds })
      } as unknown as NextRequest;
      
      // Mock the service response
      const mockComparisonResults = {
        'user': {
          'create': { 'John Doe': true, 'Jane Smith': false }
        },
        'role': {
          'read': { 'John Doe': true, 'Jane Smith': true }
        }
      };
      
      (comparePermissions as jest.Mock).mockResolvedValue(mockComparisonResults);
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual(mockComparisonResults);
      
      // Check that the service function was called correctly
      expect(comparePermissions).toHaveBeenCalledWith(mockType, mockIds, mockTenantId);
    });
    
    it('returns 404 if tenant is not found', async () => {
      // Mock the request without tenant
      const req = {
        json: jest.fn().mockResolvedValue({ type: 'roles', ids: ['role-1', 'role-2'] })
      } as unknown as NextRequest;
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Tenant not found' });
    });
    
    it('returns 400 if request format is invalid', async () => {
      // Mock the request with invalid format
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ type: 'roles' }) // Missing ids
      } as unknown as NextRequest;
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid request format. Type and at least two IDs are required.' });
    });
    
    it('returns 400 if ids array has less than 2 items', async () => {
      // Mock the request with only one ID
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ type: 'roles', ids: ['role-1'] })
      } as unknown as NextRequest;
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid request format. Type and at least two IDs are required.' });
    });
    
    it('returns 500 if an error occurs', async () => {
      // Mock the request
      const req = {
        tenant: { id: mockTenantId },
        json: jest.fn().mockResolvedValue({ type: 'roles', ids: ['role-1', 'role-2'] })
      } as unknown as NextRequest;
      
      // Mock the service to throw an error
      (comparePermissions as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to compare permissions' });
    });
  });
});
