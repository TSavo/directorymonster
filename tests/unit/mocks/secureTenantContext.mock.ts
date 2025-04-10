/**
 * Mock for secureTenantContext middleware
 */
import { NextRequest, NextResponse } from 'next/server';
import { ResourceType, Permission } from '@/lib/role/types';

/**
 * Default mock implementation for withSecureTenantPermission
 *
 * This implementation bypasses the actual permission check and directly calls
 * the handler with a mock context object.
 */
export const mockWithSecureTenantPermission = jest.fn().mockImplementation(
  (
    req: NextRequest,
    resourceType: ResourceType,
    permission: Permission,
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) => {
    // Create a context object with the necessary properties
    const context = {
      tenantId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-123',
      requestId: 'request-123',
      siteId: req.headers.get('x-site-id') || undefined
    };

    // Call the handler with the request and context
    return handler(req, context);
  }
);

/**
 * Mock implementation that simulates permission denial
 */
export const mockWithPermissionDenied = jest.fn().mockImplementation(
  (
    req: NextRequest,
    resourceType: ResourceType,
    permission: Permission,
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) => {
    // Return 403 Forbidden
    return NextResponse.json(
      {
        error: 'Permission denied',
        message: `You do not have ${permission} permission for ${resourceType}`,
        details: {
          resourceType,
          permission
        }
      },
      { status: 403 }
    );
  }
);

/**
 * Create the mock module with default implementations
 */
const mockSecureTenantContext = {
  withSecureTenantPermission: mockWithSecureTenantPermission,
  withSecureTenantContext: jest.fn().mockImplementation(
    (req: NextRequest, handler: (req: NextRequest, context: any) => Promise<NextResponse>) => {
      // Create a context object with the necessary properties
      const context = {
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        requestId: 'request-123',
        siteId: req.headers.get('x-site-id') || undefined
      };

      // Call the handler with the request and context
      return handler(req, context);
    }
  )
};

/**
 * Setup function to register the secureTenantContext mock
 *
 * @param mockImplementation Optional custom implementation for withSecureTenantPermission
 * @returns The mock module
 */
export function setupSecureTenantContextMock(mockImplementation?: jest.Mock) {
  // Reset mocks
  mockWithSecureTenantPermission.mockReset();

  // Use custom implementation if provided
  if (mockImplementation) {
    mockSecureTenantContext.withSecureTenantPermission = mockImplementation;
  } else {
    mockSecureTenantContext.withSecureTenantPermission = mockWithSecureTenantPermission;
  }

  // Register the mock
  jest.mock('@/app/api/middleware/secureTenantContext', () => mockSecureTenantContext);

  return mockSecureTenantContext;
}

export default mockSecureTenantContext;
