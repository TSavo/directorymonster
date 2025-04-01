/**
 * Unit tests for tenant validation middleware
 */

const { NextRequest, NextResponse } = require('next/server');
const { withTenantAccess, withPermission, withTenantContext } = require('@/middleware/tenant-validation');
const TenantMembershipService = require('@/lib/tenant-membership-service').default;
const RoleService = require('@/lib/role-service').default;
const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

// Mock TenantMembershipService
jest.mock('@/lib/tenant-membership-service', () => ({
  __esModule: true,
  default: {
    isTenantMember: jest.fn()
  }
}));

// Mock RoleService
jest.mock('@/lib/role-service', () => ({
  __esModule: true,
  default: {
    hasPermission: jest.fn()
  }
}));

// Mock TenantService (used in withTenantContext)
jest.mock('@/lib/tenant/tenant-service', () => ({
  __esModule: true,
  default: {
    getTenantByHostname: jest.fn()
  }
}));

describe('Tenant Validation Middleware', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testUserId = 'user-789';
  const testToken = 'valid-token';
  
  let mockRequest;
  let mockHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.JWT_SECRET = 'test-secret';
    
    // Create mock request
    mockRequest = {
      url: 'https://example.com/api/test',
      headers: new Headers({
        'authorization': `Bearer ${testToken}`,
        'x-tenant-id': testTenantId,
      }),
      method: 'GET',
    };
    
    // Create mock handler that returns a success response
    mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    
    // Mock jwt.verify to return a valid token
    jwt.verify.mockReturnValue({ userId: testUserId });
  });
  
  describe('withTenantAccess', () => {
    it('should call the handler if user has tenant access', async () => {
      // Arrange
      TenantMembershipService.isTenantMember.mockResolvedValueOnce(true);
      
      // Act
      const response = await withTenantAccess(mockRequest, mockHandler);
      
      // Assert
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(testUserId, testTenantId);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });
    
    it('should return 401 if tenant ID is missing', async () => {
      // Arrange
      mockRequest.headers = new Headers({
        'authorization': `Bearer ${testToken}`,
      });
      
      // Act
      const response = await withTenantAccess(mockRequest, mockHandler);
      
      // Assert
      expect(TenantMembershipService.isTenantMember).not.toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ 
        error: 'Missing tenant context or authentication' 
      });
    });
    
    it('should return 401 if authorization header is missing', async () => {
      // Arrange
      mockRequest.headers = new Headers({
        'x-tenant-id': testTenantId,
      });
      
      // Act
      const response = await withTenantAccess(mockRequest, mockHandler);
      
      // Assert
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ 
        error: 'Missing tenant context or authentication' 
      });
    });
    
    it('should return 401 if token is invalid', async () => {
      // Arrange
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      const response = await withTenantAccess(mockRequest, mockHandler);
      
      // Assert
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ 
        error: 'Invalid or expired authentication token' 
      });
    });
    
    it('should return 403 if user is not a tenant member', async () => {
      // Arrange
      TenantMembershipService.isTenantMember.mockResolvedValueOnce(false);
      
      // Act
      const response = await withTenantAccess(mockRequest, mockHandler);
      
      // Assert
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(testUserId, testTenantId);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ 
        error: 'Access denied: User is not a member of this tenant' 
      });
    });
  });
  
  describe('withPermission', () => {
    it('should call the handler if user has required permission', async () => {
      // Arrange
      TenantMembershipService.isTenantMember.mockResolvedValueOnce(true);
      RoleService.hasPermission.mockResolvedValueOnce(true);
      
      // Act
      const response = await withPermission(
        mockRequest,
        'category',
        'create',
        undefined,
        mockHandler
      );
      
      // Assert
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(testUserId, testTenantId);
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        testUserId,
        testTenantId,
        'category',
        'create',
        undefined
      );
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response.status).toBe(200);
    });
    
    it('should return 403 if user does not have required permission', async () => {
      // Arrange
      TenantMembershipService.isTenantMember.mockResolvedValueOnce(true);
      RoleService.hasPermission.mockResolvedValueOnce(false);
      
      // Act
      const response = await withPermission(
        mockRequest,
        'category',
        'create',
        undefined,
        mockHandler
      );
      
      // Assert
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(testUserId, testTenantId);
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        testUserId,
        testTenantId,
        'category',
        'create',
        undefined
      );
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ 
        error: 'Permission denied: Required create permission for category' 
      });
    });
    
    it('should check specific resource ID when provided', async () => {
      // Arrange
      const resourceId = 'category-123';
      TenantMembershipService.isTenantMember.mockResolvedValueOnce(true);
      RoleService.hasPermission.mockResolvedValueOnce(true);
      
      // Act
      const response = await withPermission(
        mockRequest,
        'category',
        'update',
        resourceId,
        mockHandler
      );
      
      // Assert
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        testUserId,
        testTenantId,
        'category',
        'update',
        resourceId
      );
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    });
  });
  
  describe('withTenantContext', () => {
    it('should add tenant ID header based on hostname', async () => {
      // Arrange
      const hostname = 'example.com';
      const TenantService = require('@/lib/tenant/tenant-service').default;
      
      mockRequest = {
        url: `https://${hostname}/api/test`,
        headers: new Headers({
          'host': hostname,
        }),
        method: 'GET',
      };
      
      TenantService.getTenantByHostname.mockResolvedValueOnce({
        id: testTenantId,
        name: 'Example Tenant',
      });
      
      // Create a spy on Headers.set
      const headersSpy = jest.spyOn(Headers.prototype, 'set');
      
      // Act
      await withTenantContext(mockRequest, mockHandler);
      
      // Assert
      expect(TenantService.getTenantByHostname).toHaveBeenCalledWith(hostname);
      expect(headersSpy).toHaveBeenCalledWith('x-tenant-id', testTenantId);
      expect(mockHandler).toHaveBeenCalled();
    });
    
    it('should return 404 if hostname does not resolve to a tenant', async () => {
      // Arrange
      const hostname = 'invalid-domain.com';
      const TenantService = require('@/lib/tenant/tenant-service').default;
      
      mockRequest = {
        url: `https://${hostname}/api/test`,
        headers: new Headers({
          'host': hostname,
        }),
        method: 'GET',
      };
      
      TenantService.getTenantByHostname.mockResolvedValueOnce(null);
      
      // Act
      const response = await withTenantContext(mockRequest, mockHandler);
      
      // Assert
      expect(TenantService.getTenantByHostname).toHaveBeenCalledWith(hostname);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ 
        error: `Invalid tenant hostname: ${hostname}` 
      });
    });
    
    it('should use x-forwarded-host header if available', async () => {
      // Arrange
      const forwardedHost = 'forwarded.example.com';
      const actualHost = 'origin.example.com';
      const TenantService = require('@/lib/tenant/tenant-service').default;
      
      mockRequest = {
        url: `https://${actualHost}/api/test`,
        headers: new Headers({
          'host': actualHost,
          'x-forwarded-host': forwardedHost,
        }),
        method: 'GET',
      };
      
      TenantService.getTenantByHostname.mockResolvedValueOnce({
        id: testTenantId,
        name: 'Example Tenant',
      });
      
      // Act
      await withTenantContext(mockRequest, mockHandler);
      
      // Assert
      expect(TenantService.getTenantByHostname).toHaveBeenCalledWith(forwardedHost);
    });
  });
});
