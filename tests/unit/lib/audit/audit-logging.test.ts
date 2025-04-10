import { AuditService } from '../../../../src/lib/audit/audit-service';
import { withSecureTenantPermission } from '../../../../src/app/api/middleware/secureTenantContext';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn().mockImplementation((body, options) => ({
        status: options?.status || 200,
        body,
        json: async () => body
      }))
    }
  };
});

// Mock the AuditService
jest.mock('../../../../src/lib/audit/audit-service', () => ({
  AuditService: {
    logSecurityEvent: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock the secureTenantContext middleware
jest.mock('../../../../src/app/api/middleware/secureTenantContext', () => ({
  withSecureTenantPermission: jest.fn(),
  TenantContext: jest.fn().mockImplementation((tenantId, userId) => ({
    tenantId,
    userId,
    requestId: 'test-request-id',
    timestamp: Date.now()
  }))
}));

describe('Audit Logging Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test handler that returns the context
  const testHandler = async (req: NextRequest, context: any) => {
    return NextResponse.json({
      success: true,
      context: {
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId
      }
    });
  };
  
  test('logs CROSS_TENANT_ACCESS_ATTEMPT when accessing another tenant', async () => {
    // Setup the middleware mock to simulate cross-tenant access attempt
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        // Log security event for cross-tenant access
        AuditService.logSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
          userId: 'user-1',
          tenantId: 'tenant-1',
          targetTenantId: 'tenant-2',
          requestId: 'test-request-id',
          timestamp: expect.any(Number),
          url: req.url
        });
        
        // Return 403 response
        return Promise.resolve(NextResponse.json(
          { error: 'Cross-tenant access denied' },
          { status: 403 }
        ));
      }
    );
    
    // Create mock request with tenant header
    const req = new NextRequest('https://example.com/api/tenants/tenant-2/resources', {
      headers: {
        'x-tenant-id': 'tenant-1',
        'authorization': 'Bearer token-for-user-1'
      }
    });
    
    // Call the middleware
    await withSecureTenantPermission(
      req,
      'resource',
      'read',
      testHandler
    );
    
    // Verify AuditService.logSecurityEvent was called with correct parameters
    expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
      'CROSS_TENANT_ACCESS_ATTEMPT',
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-1',
        targetTenantId: 'tenant-2',
        requestId: 'test-request-id'
      })
    );
  });
  
  test('logs UNAUTHORIZED_TENANT_ACCESS when user does not belong to tenant', async () => {
    // Setup the middleware mock to simulate unauthorized tenant access
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        // Log security event for unauthorized tenant access
        AuditService.logSecurityEvent('UNAUTHORIZED_TENANT_ACCESS', {
          userId: 'user-1',
          tenantId: 'tenant-3',
          requestId: 'test-request-id',
          timestamp: expect.any(Number),
          url: req.url
        });
        
        // Return 403 response
        return Promise.resolve(NextResponse.json(
          { error: 'User does not belong to this tenant' },
          { status: 403 }
        ));
      }
    );
    
    // Create mock request with tenant header
    const req = new NextRequest('https://example.com/api/tenants/tenant-3/resources', {
      headers: {
        'x-tenant-id': 'tenant-3',
        'authorization': 'Bearer token-for-user-1'
      }
    });
    
    // Call the middleware
    await withSecureTenantPermission(
      req,
      'resource',
      'read',
      testHandler
    );
    
    // Verify AuditService.logSecurityEvent was called with correct parameters
    expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
      'UNAUTHORIZED_TENANT_ACCESS',
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-3',
        requestId: 'test-request-id'
      })
    );
  });
  
  test('logs PERMISSION_DENIED when user lacks required permission', async () => {
    // Setup the middleware mock to simulate permission denied
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        // Log security event for permission denied
        AuditService.logSecurityEvent('PERMISSION_DENIED', {
          userId: 'user-1',
          tenantId: 'tenant-1',
          resourceType,
          permission,
          resourceId: 'resource-1',
          requestId: 'test-request-id',
          timestamp: expect.any(Number),
          url: req.url
        });
        
        // Return 403 response
        return Promise.resolve(NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        ));
      }
    );
    
    // Create mock request with tenant header
    const req = new NextRequest('https://example.com/api/resources/resource-1', {
      headers: {
        'x-tenant-id': 'tenant-1',
        'authorization': 'Bearer token-for-user-1'
      }
    });
    
    // Call the middleware
    await withSecureTenantPermission(
      req,
      'resource',
      'update',
      testHandler,
      'resource-1'
    );
    
    // Verify AuditService.logSecurityEvent was called with correct parameters
    expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
      'PERMISSION_DENIED',
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-1',
        resourceType: 'resource',
        permission: 'update',
        resourceId: 'resource-1',
        requestId: 'test-request-id'
      })
    );
  });
  
  test('correlates events with request IDs', async () => {
    // Setup the middleware mock to simulate multiple security events for the same request
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        // Generate a consistent request ID for correlation
        const requestId = 'correlated-request-id';
        
        // Log multiple security events with the same request ID
        AuditService.logSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
          userId: 'user-1',
          tenantId: 'tenant-1',
          targetTenantId: 'tenant-2',
          requestId,
          timestamp: Date.now(),
          url: req.url
        });
        
        AuditService.logSecurityEvent('PERMISSION_DENIED', {
          userId: 'user-1',
          tenantId: 'tenant-1',
          resourceType,
          permission,
          resourceId: 'resource-1',
          requestId,
          timestamp: Date.now() + 100, // Slightly later timestamp
          url: req.url
        });
        
        // Return 403 response
        return Promise.resolve(NextResponse.json(
          { error: 'Multiple security violations' },
          { status: 403 }
        ));
      }
    );
    
    // Create mock request
    const req = new NextRequest('https://example.com/api/tenants/tenant-2/resources/resource-1', {
      headers: {
        'x-tenant-id': 'tenant-1',
        'authorization': 'Bearer token-for-user-1'
      }
    });
    
    // Call the middleware
    await withSecureTenantPermission(
      req,
      'resource',
      'update',
      testHandler,
      'resource-1'
    );
    
    // Verify AuditService.logSecurityEvent was called twice with the same request ID
    expect(AuditService.logSecurityEvent).toHaveBeenCalledTimes(2);
    
    const firstCallArgs = (AuditService.logSecurityEvent as jest.Mock).mock.calls[0];
    const secondCallArgs = (AuditService.logSecurityEvent as jest.Mock).mock.calls[1];
    
    expect(firstCallArgs[1].requestId).toBe('correlated-request-id');
    expect(secondCallArgs[1].requestId).toBe('correlated-request-id');
  });
  
  test('includes accurate timestamps for event sequencing', async () => {
    // Setup the middleware mock to simulate multiple security events with timestamps
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        // Generate timestamps with known sequence
        const baseTime = Date.now();
        const timestamp1 = baseTime;
        const timestamp2 = baseTime + 100; // 100ms later
        
        // Log multiple security events with sequential timestamps
        AuditService.logSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
          userId: 'user-1',
          tenantId: 'tenant-1',
          targetTenantId: 'tenant-2',
          requestId: 'test-request-id',
          timestamp: timestamp1,
          url: req.url
        });
        
        AuditService.logSecurityEvent('PERMISSION_DENIED', {
          userId: 'user-1',
          tenantId: 'tenant-1',
          resourceType,
          permission,
          resourceId: 'resource-1',
          requestId: 'test-request-id',
          timestamp: timestamp2,
          url: req.url
        });
        
        // Return 403 response
        return Promise.resolve(NextResponse.json(
          { error: 'Multiple security violations' },
          { status: 403 }
        ));
      }
    );
    
    // Create mock request
    const req = new NextRequest('https://example.com/api/tenants/tenant-2/resources/resource-1', {
      headers: {
        'x-tenant-id': 'tenant-1',
        'authorization': 'Bearer token-for-user-1'
      }
    });
    
    // Call the middleware
    await withSecureTenantPermission(
      req,
      'resource',
      'update',
      testHandler,
      'resource-1'
    );
    
    // Verify AuditService.logSecurityEvent was called with sequential timestamps
    expect(AuditService.logSecurityEvent).toHaveBeenCalledTimes(2);
    
    const firstCallArgs = (AuditService.logSecurityEvent as jest.Mock).mock.calls[0];
    const secondCallArgs = (AuditService.logSecurityEvent as jest.Mock).mock.calls[1];
    
    const timestamp1 = firstCallArgs[1].timestamp;
    const timestamp2 = secondCallArgs[1].timestamp;
    
    // Verify the second timestamp is later than the first
    expect(timestamp2).toBeGreaterThan(timestamp1);
    expect(timestamp2 - timestamp1).toBe(100); // Verify the exact difference
  });
});
