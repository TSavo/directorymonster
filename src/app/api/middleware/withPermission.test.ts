import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'jsonwebtoken';
import RoleService from '@/lib/role-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { 
  withPermission, 
  withAnyPermission, 
  withAllPermissions, 
  withResourcePermission,
  withAuditedPermission
} from './withPermission';
import { withTenantAccess } from './withTenantAccess';

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
}));

jest.mock('@/lib/role-service', () => ({
  hasPermission: jest.fn(),
  hasRoleInTenant: jest.fn(),
}));

jest.mock('@/lib/tenant-membership-service', () => ({
  isTenantMember: jest.fn(),
}));

jest.mock('./withTenantAccess', () => ({
  withTenantAccess: jest.fn(),
}));

describe('Permission middleware', () => {
  let mockRequest: NextRequest;
  let mockHandler: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup basic request mock
    mockRequest = {
      url: 'https://example.com/api/test',
      headers: new Headers({
        'x-tenant-id': 'test-tenant-id',
        'authorization': 'Bearer test-token',
      }),
      method: 'GET',
      clone: jest.fn().mockReturnThis(),
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;
    
    // Setup mock handler
    mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    
    // Setup mock tenant access middleware
    (withTenantAccess as jest.Mock).mockImplementation((req, handler) => handler(req));
    
    // Setup mock jwt decode
    (decode as jest.Mock).mockReturnValue({ userId: 'test-user-id' });
    
    // Setup mock role service
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
    (RoleService.hasRoleInTenant as jest.Mock).mockResolvedValue(true);
  });
  
  describe('withPermission', () => {
    it('should call handler when user has permission', async () => {
      const response = await withPermission(
        mockRequest,
        'category',
        'read',
        mockHandler
      );
      
      expect(withTenantAccess).toHaveBeenCalled();
      expect(decode).toHaveBeenCalledWith('test-token');
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        undefined
      );
      expect(mockHandler).toHaveBeenCalled();
      
      expect(response.status).toBe(200);
    });
    
    it('should consider resource ID when provided', async () => {
      await withPermission(
        mockRequest,
        'category',
        'read',
        mockHandler,
        'test-resource-id'
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        'test-resource-id'
      );
    });
    
    it('should return 403 when permission is denied', async () => {
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
      
      const mockResponse = { status: 403, body: { error: 'Permission denied' } };
      mockHandler.mockResolvedValue(mockResponse);
      
      const response = await withPermission(
        mockRequest,
        'category',
        'update',
        mockHandler
      );
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });
  
  describe('withAnyPermission', () => {
    it('should grant access if user has any of the permissions', async () => {
      (RoleService.hasPermission as jest.Mock)
        .mockResolvedValueOnce(false)  // First permission check fails
        .mockResolvedValueOnce(true);  // Second permission check succeeds
      
      const response = await withAnyPermission(
        mockRequest,
        'category',
        ['create', 'update'],
        mockHandler
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
    
    it('should deny access if user has none of the permissions', async () => {
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
      
      const response = await withAnyPermission(
        mockRequest,
        'category',
        ['create', 'update'],
        mockHandler
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });
  
  describe('withAllPermissions', () => {
    it('should grant access if user has all permissions', async () => {
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
      
      const response = await withAllPermissions(
        mockRequest,
        'category',
        ['read', 'update'],
        mockHandler
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
    
    it('should deny access if user is missing any permission', async () => {
      (RoleService.hasPermission as jest.Mock)
        .mockResolvedValueOnce(true)   // First permission check succeeds
        .mockResolvedValueOnce(false); // Second permission check fails
      
      const response = await withAllPermissions(
        mockRequest,
        'category',
        ['read', 'update'],
        mockHandler
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });
  
  describe('withResourcePermission', () => {
    beforeEach(() => {
      // Setup URL with query param
      mockRequest.url = 'https://example.com/api/test?id=query-id';
    });
    
    it('should extract resource ID from URL query params', async () => {
      await withResourcePermission(
        mockRequest,
        'category',
        'read',
        mockHandler
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        'query-id'
      );
    });
    
    it('should try to extract resource ID from request body for POST requests', async () => {
      // Setup POST request with body
      mockRequest.method = 'POST';
      mockRequest.url = 'https://example.com/api/test'; // No query param
      (mockRequest.json as jest.Mock).mockResolvedValue({ id: 'body-id' });
      
      await withResourcePermission(
        mockRequest,
        'category',
        'create',
        mockHandler
      );
      
      expect(mockRequest.json).toHaveBeenCalled();
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'create',
        'body-id'
      );
    });
    
    it('should extract resource ID from URL path as fallback', async () => {
      // Setup URL with ID in path
      mockRequest.url = 'https://example.com/api/categories/path-id';
      (mockRequest.json as jest.Mock).mockImplementation(() => { 
        throw new Error('Cannot parse body');
      });
      
      await withResourcePermission(
        mockRequest,
        'category',
        'read',
        mockHandler
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        'path-id'
      );
    });
    
    it('should allow custom ID parameter names', async () => {
      // Setup URL with custom query param
      mockRequest.url = 'https://example.com/api/test?categoryId=custom-id';
      
      await withResourcePermission(
        mockRequest,
        'category',
        'read',
        mockHandler,
        'categoryId'
      );
      
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        'custom-id'
      );
    });
  });
  
  describe('withAuditedPermission', () => {
    it('should log successful permission access', async () => {
      // Mock console.log to track audit logging
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      const response = await withAuditedPermission(
        mockRequest,
        'category',
        'read',
        mockHandler
      );
      
      expect(withTenantAccess).toHaveBeenCalled();
      expect(decode).toHaveBeenCalledWith('test-token');
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        undefined
      );
      expect(mockHandler).toHaveBeenCalled();
      
      // Verify audit logging occurred
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Audit event:',
        expect.stringContaining('access')
      );
      
      expect(response.status).toBe(200);
      
      // Restore console.log
      mockConsoleLog.mockRestore();
    });
    
    it('should log permission denied events', async () => {
      // Mock console.log to track audit logging
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      // Make permission check fail
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
      
      const response = await withAuditedPermission(
        mockRequest,
        'category',
        'update',
        mockHandler
      );
      
      // Verify denial was logged
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Audit event:',
        expect.stringContaining('denied')
      );
      
      expect(response.status).toBe(403);
      
      // Restore console.log
      mockConsoleLog.mockRestore();
    });
  });
});
