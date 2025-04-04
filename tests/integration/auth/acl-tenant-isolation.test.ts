/**
 * ACL Integration Test - Tenant Isolation
 * Tests that ACL permissions are properly enforced across tenant boundaries
 */

// Mock the audit service
jest.mock('@/lib/audit/audit-service', () => {
  return {
    __esModule: true,
    default: {
      logEvent: jest.fn().mockResolvedValue({}),
      logRoleEvent: jest.fn().mockResolvedValue({}),
      logUserEvent: jest.fn().mockResolvedValue({}),
      logTenantEvent: jest.fn().mockResolvedValue({}),
      logAuthEvent: jest.fn().mockResolvedValue({}),
      logSystemEvent: jest.fn().mockResolvedValue({}),
      AUDIT_EVENT_PREFIX: 'audit:event:',
      AUDIT_TENANT_PREFIX: 'audit:tenant:',
      AUDIT_USER_PREFIX: 'audit:user:'
    },
    AuditService: {
      logEvent: jest.fn().mockResolvedValue({}),
      logRoleEvent: jest.fn().mockResolvedValue({}),
      logUserEvent: jest.fn().mockResolvedValue({}),
      logTenantEvent: jest.fn().mockResolvedValue({}),
      logAuthEvent: jest.fn().mockResolvedValue({}),
      logSystemEvent: jest.fn().mockResolvedValue({}),
      AUDIT_EVENT_PREFIX: 'audit:event:',
      AUDIT_TENANT_PREFIX: 'audit:tenant:',
      AUDIT_USER_PREFIX: 'audit:user:'
    }
  };
});

import {
  setupTestTenants,
  setupTestUsersAndRoles,
  cleanupTestData,
  TestUser,
  TestTenant,
  createMockRequest
} from './acl-test-setup';
import { withPermission } from '@/middleware/tenant-validation';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { NextRequest, NextResponse } from 'next/server';

describe('ACL Tenant Isolation Integration Tests', () => {
  let tenantA: TestTenant;
  let tenantB: TestTenant;
  let adminA: TestUser;
  let adminB: TestUser;
  let regularUser: TestUser;

  // Set up test data before all tests
  beforeAll(async () => {
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = 'test-secret';
    const tenants = await setupTestTenants();
    tenantA = tenants.tenantA;
    tenantB = tenants.tenantB;

    const users = await setupTestUsersAndRoles(tenantA, tenantB);
    adminA = users.adminA;
    adminB = users.adminB;
    regularUser = users.regularUser;
  });

  // Clean up test data after all tests
  afterAll(async () => {
    await cleanupTestData();
  });

  // Test that permissions are tenant-specific
  test('should enforce tenant isolation in permission middleware', async () => {
    // Mock request handler that returns success
    const mockHandler = jest.fn().mockImplementation(
      (req: NextRequest) => Promise.resolve(NextResponse.json({ success: true }))
    );

    // Test adminA accessing category in tenantA (should succeed)
    const reqAdminA = createMockRequest({
      'authorization': `Bearer ${adminA.token}`,
      'x-tenant-id': tenantA.id
    });

    const responseAdminA = await withPermission(
      reqAdminA,
      'category' as ResourceType,
      'manage' as Permission,
      undefined, // resourceId
      mockHandler
    );
    const dataAdminA = await responseAdminA.json();

    expect(responseAdminA.status).toBe(200);
    expect(dataAdminA.success).toBe(true);
    expect(mockHandler).toHaveBeenCalled();

    // Reset mock
    mockHandler.mockClear();

    // Test adminA accessing category in tenantB (should fail)
    const reqCrossTenant = createMockRequest({
      'authorization': `Bearer ${adminA.token}`,
      'x-tenant-id': tenantB.id
    });

    const responseCrossTenant = await withPermission(
      reqCrossTenant,
      'category' as ResourceType,
      'manage' as Permission,
      undefined, // resourceId
      mockHandler
    );

    expect(responseCrossTenant.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  // Test that regular users can only access permitted resources
  test('should enforce permission boundaries within a tenant', async () => {
    // Mock request handler that returns success
    const mockHandler = jest.fn().mockImplementation(
      (req: NextRequest) => Promise.resolve(NextResponse.json({ success: true }))
    );

    // Test regularUser accessing listing in tenantA (should succeed - has 'read' permission)
    const reqListingRead = createMockRequest({
      'authorization': `Bearer ${regularUser.token}`,
      'x-tenant-id': tenantA.id
    });

    const responseListingRead = await withPermission(
      reqListingRead,
      'listing' as ResourceType,
      'read' as Permission,
      undefined, // resourceId
      mockHandler
    );
    const dataListingRead = await responseListingRead.json();

    expect(responseListingRead.status).toBe(200);
    expect(dataListingRead.success).toBe(true);
    expect(mockHandler).toHaveBeenCalled();

    // Reset mock
    mockHandler.mockClear();

    // Test regularUser accessing listing in tenantA with 'update' permission (should fail)
    const reqListingUpdate = createMockRequest({
      'authorization': `Bearer ${regularUser.token}`,
      'x-tenant-id': tenantA.id
    });

    const responseListingUpdate = await withPermission(
      reqListingUpdate,
      'listing' as ResourceType,
      'update' as Permission,
      undefined, // resourceId
      mockHandler
    );

    expect(responseListingUpdate.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
