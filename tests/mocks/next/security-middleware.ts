// Standard security middleware mocks for testing
import { NextRequest, NextResponse } from 'next/server';
import { mockNextResponseJson } from './response';

// Mock tenant context class
export class MockTenantContext {
  tenantId: string;
  userId: string;
  requestId: string;
  timestamp: number;
  
  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.requestId = 'test-request-id';
    this.timestamp = Date.now();
  }
  
  static async fromRequest(req: any): Promise<MockTenantContext | null> {
    // Allow tests to control whether context creation succeeds
    if (!securityContextShouldSucceed) {
      return null;
    }
    return new MockTenantContext(
      contextTenantId || req.headers.get('x-tenant-id') || 'default-tenant',
      contextUserId || 'default-user'
    );
  }
}

// Control variables for security middleware tests
export let securityContextShouldSucceed = true;
export let contextTenantId = 'test-tenant-id';
export let contextUserId = 'test-user-id';
export let securityResponseStatus = 200;
export let securityResponseBody = { success: true };

// Mock role service
export const mockRoleService = {
  hasPermission: jest.fn().mockResolvedValue(true),
  hasRoleInTenant: jest.fn().mockResolvedValue(true),
  getRoles: jest.fn().mockResolvedValue(['user']),
  assignRole: jest.fn().mockResolvedValue(true)
};

/**
 * Setup standard security middleware mocks for testing
 */
export function setupSecurityMiddlewareMocks(): void {
  // Mock TenantContext and security middleware
  jest.mock('@/app/api/middleware/secureTenantContext', () => ({
    TenantContext: MockTenantContext,
    
    withSecureTenantContext: jest.fn().mockImplementation(async (req, handler) => {
      const context = await MockTenantContext.fromRequest(req);
      
      if (!context) {
        return mockNextResponseJson(
          { error: 'Unauthorized', message: 'Invalid tenant context' },
          { status: 401 }
        );
      }
      
      // Allow tests to force specific responses
      if (securityResponseStatus !== 200) {
        return mockNextResponseJson(
          securityResponseBody,
          { status: securityResponseStatus }
        );
      }
      
      return handler(req, context);
    }),
    
    withSecureTenantPermission: jest.fn().mockImplementation(
      async (req, resourceType, permission, handler, resourceId) => {
        const context = await MockTenantContext.fromRequest(req);
        
        if (!context) {
          return mockNextResponseJson(
            { error: 'Unauthorized', message: 'Invalid tenant context' },
            { status: 401 }
          );
        }
        
        // Check permissions using mocked RoleService
        const hasPermission = await mockRoleService.hasPermission(
          context.userId,
          context.tenantId,
          resourceType,
          permission,
          resourceId
        );
        
        if (!hasPermission) {
          return mockNextResponseJson(
            { error: 'Permission denied' },
            { status: 403 }
          );
        }
        
        // Allow tests to force specific responses
        if (securityResponseStatus !== 200) {
          return mockNextResponseJson(
            securityResponseBody,
            { status: securityResponseStatus }
          );
        }
        
        return handler(req, context);
      }
    )
  }));

  // Mock RoleService
  jest.mock('@/lib/role-service', () => ({
    __esModule: true,
    default: mockRoleService
  }));
}

/**
 * Reset security middleware mocks between tests
 */
export function resetSecurityMiddlewareMocks(): void {
  securityContextShouldSucceed = true;
  contextTenantId = 'test-tenant-id';
  contextUserId = 'test-user-id';
  securityResponseStatus = 200;
  securityResponseBody = { success: true };
  
  // Reset mock functions
  mockRoleService.hasPermission.mockResolvedValue(true);
  mockRoleService.hasRoleInTenant.mockResolvedValue(true);
  mockRoleService.getRoles.mockResolvedValue(['user']);
  mockRoleService.assignRole.mockResolvedValue(true);
}

/**
 * Force security middleware to fail with specified status and message
 * 
 * @param status HTTP status code for the error
 * @param message Error message to return
 */
export function setSecurityMiddlewareFailure(status: number, message: string): void {
  securityContextShouldSucceed = true; // We'll fail at a later stage
  securityResponseStatus = status;
  securityResponseBody = { error: message };
}

/**
 * Setup security middleware to prohibit a specific permission
 * 
 * @param resourceType Resource type to check
 * @param permission Permission to deny
 */
export function denyPermission(resourceType: string, permission: string): void {
  mockRoleService.hasPermission.mockImplementation(
    (userId, tenantId, resource, perm) => {
      return Promise.resolve(!(resource === resourceType && perm === permission));
    }
  );
}