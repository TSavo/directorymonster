import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
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
  verify: jest.fn(),
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

// Mock the console.log for audit tests
const originalConsoleLog = console.log;
let consoleLogMock: jest.SpyInstance;

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
    
    // Setup mock jwt verify
    (verify as jest.Mock).mockReturnValue({ userId: 'test-user-id' });
    
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
      expect(verify).toHaveBeenCalledWith('test-token', expect.any(String));
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
    
    it('should deny access when an empty permissions array is provided', async () => {
      const response = await withAnyPermission(
        mockRequest,
        'category',
        [],
        mockHandler
      );
      
      // No permission checks should be performed
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      
      // Verify the response contains appropriate error details
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error', 'Permission denied');
      expect(responseBody).toHaveProperty('message', expect.stringContaining('Required one of'));
      expect(responseBody.details).toHaveProperty('permissions');
      expect(responseBody.details.permissions).toEqual([]);
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
    
    it('should grant access for an empty permissions array', async () => {
      const response = await withAllPermissions(
        mockRequest,
        'category',
        [],
        mockHandler
      );
      
      // No permission checks should be needed for an empty array
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
      // Handler should be called since all (zero) permissions are satisfied
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
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
    beforeEach(() => {
      // Setup console.log mock for audit tests
      consoleLogMock = jest.spyOn(console, 'log').mockImplementation();
    });
    
    afterEach(() => {
      // Restore console.log
      consoleLogMock.mockRestore();
    });
    
    it('should log successful permission access with correct details', async () => {
      const response = await withAuditedPermission(
        mockRequest,
        'category',
        'read',
        mockHandler
      );
      
      expect(withTenantAccess).toHaveBeenCalled();
      expect(verify).toHaveBeenCalledWith('test-token', expect.any(String));
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'category',
        'read',
        undefined
      );
      expect(mockHandler).toHaveBeenCalled();
      
      // Verify audit logging occurred with correct details
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('Audit event:'),
        expect.stringContaining('"action":"access"')
      );
      
      // Check that all required details are included in the JSON string
      const logCall = consoleLogMock.mock.calls[0];
      const loggedJson = logCall[1]; // The second argument to console.log
      
      // Parse the JSON string to verify its contents
      const logData = JSON.parse(loggedJson);
      expect(logData).toEqual(expect.objectContaining({
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        resourceType: 'category',
        action: 'access',
        details: expect.objectContaining({
          permission: 'read',
          method: 'GET',
          path: '/api/test'
        })
      }));
      
      expect(response.status).toBe(200);
    });
    
    it('should log permission denied events with correct details', async () => {
      // Make permission check fail
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
      
      const response = await withAuditedPermission(
        mockRequest,
        'category',
        'update',
        mockHandler,
        'specific-resource-id'
      );
      
      // Verify denial was logged with correct details
      expect(consoleLogMock).toHaveBeenCalledWith(
        expect.stringContaining('Audit event:'),
        expect.stringContaining('"action":"denied"')
      );
      
      // Check that all required details are included in the JSON string
      const logCall = consoleLogMock.mock.calls[0];
      const loggedJson = logCall[1]; // The second argument to console.log
      
      // Parse the JSON string to verify its contents
      const logData = JSON.parse(loggedJson);
      expect(logData).toEqual(expect.objectContaining({
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        resourceType: 'category',
        action: 'denied',
        resourceId: 'specific-resource-id',
        details: expect.objectContaining({
          permission: 'update',
          method: 'GET',
          path: '/api/test'
        })
      }));
      
      expect(response.status).toBe(403);
    });
    
    it('should include the correct request context in audit logs', async () => {
      // Setup a different request method and URL
      mockRequest.method = 'POST';
      mockRequest.url = 'https://example.com/api/categories/create';
      
      await withAuditedPermission(
        mockRequest,
        'category',
        'create',
        mockHandler
      );
      
      // Get and parse the logged JSON
      const logCall = consoleLogMock.mock.calls[0];
      const loggedJson = logCall[1];
      const logData = JSON.parse(loggedJson);
      
      // Verify request details are correctly included in the audit log
      expect(logData.details).toEqual(expect.objectContaining({
        method: 'POST',
        path: '/api/categories/create'
      }));
    });
  });
});
