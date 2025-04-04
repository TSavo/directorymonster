/**
 * ACL Integration Test Setup Helper
 * Creates test tenants, users, and roles for ACL testing
 */

import { redis, kv } from '@/lib/redis-client';
import TenantService from '@/lib/tenant/tenant-service';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { createTenantAdminRole } from '@/components/admin/auth/utils/roles';
import { KeyNamespaceService } from '@/lib/key-namespace-service';
import jwt from 'jsonwebtoken';
import httpMocks from 'node-mocks-http';
import { NextRequest } from 'next/server';

export interface TestUser {
  id: string;
  token: string;
}

export interface TestTenant {
  id: string;
  name: string;
  hostname?: string;
  hostnames?: string[];
}

// Test data IDs for cleanup
export const TEST_IDS = {
  TENANT_A: 'tenant-a-test',
  TENANT_B: 'tenant-b-test',
  USER_ADMIN_A: 'admin-a-test',
  USER_ADMIN_B: 'admin-b-test',
  USER_REGULAR: 'user-regular-test',
  ROLE_ADMIN_A: 'role-admin-a-test',
  ROLE_ADMIN_B: 'role-admin-b-test',
  ROLE_REGULAR: 'role-regular-test',
};

// Generate JWT token for a user
export function generateUserToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign({ userId }, secret, { expiresIn: '1h' });
}

// Set up test tenants
export async function setupTestTenants(): Promise<{tenantA: TestTenant, tenantB: TestTenant}> {
  // Create two test tenants
  const tenantA = await TenantService.createTenant({
    id: TEST_IDS.TENANT_A,
    name: 'Test Tenant A',
    hostnames: ['tenant-a-test.example.com']
  });

  const tenantB = await TenantService.createTenant({
    id: TEST_IDS.TENANT_B,
    name: 'Test Tenant B',
    hostnames: ['tenant-b-test.example.com']
  });

  return {
    tenantA: {
      id: tenantA.id,
      name: tenantA.name,
      hostname: tenantA.hostname
    },
    tenantB: {
      id: tenantB.id,
      name: tenantB.name,
      hostname: tenantB.hostname
    }
  };
}

// Set up test users and roles
export async function setupTestUsersAndRoles(
  tenantA: TestTenant,
  tenantB: TestTenant
): Promise<{adminA: TestUser, adminB: TestUser, regularUser: TestUser}> {
  // Create admin role for Tenant A
  const adminRoleA = await RoleService.createRole({
    ...createTenantAdminRole(tenantA.id, 'Admin Role A'),
    id: TEST_IDS.ROLE_ADMIN_A
  });

  // Create admin role for Tenant B
  const adminRoleB = await RoleService.createRole({
    ...createTenantAdminRole(tenantB.id, 'Admin Role B'),
    id: TEST_IDS.ROLE_ADMIN_B
  });

  // Create regular role with limited permissions
  const regularRole = await RoleService.createRole({
    id: TEST_IDS.ROLE_REGULAR,
    name: 'Regular Role',
    description: 'Regular user with limited permissions',
    tenantId: tenantA.id,
    isGlobal: false,
    aclEntries: [
      {
        resource: {
          type: 'listing' as ResourceType,
          tenantId: tenantA.id
        },
        permission: 'read' as Permission
      },
      {
        resource: {
          type: 'category' as ResourceType,
          tenantId: tenantA.id
        },
        permission: 'read' as Permission
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Create test users
  const adminA: TestUser = {
    id: TEST_IDS.USER_ADMIN_A,
    token: generateUserToken(TEST_IDS.USER_ADMIN_A)
  };

  const adminB: TestUser = {
    id: TEST_IDS.USER_ADMIN_B,
    token: generateUserToken(TEST_IDS.USER_ADMIN_B)
  };

  const regularUser: TestUser = {
    id: TEST_IDS.USER_REGULAR,
    token: generateUserToken(TEST_IDS.USER_REGULAR)
  };

  // Assign roles to users
  await RoleService.assignRoleToUser(adminA.id, tenantA.id, adminRoleA.id);
  await RoleService.assignRoleToUser(adminB.id, tenantB.id, adminRoleB.id);
  await RoleService.assignRoleToUser(regularUser.id, tenantA.id, regularRole.id);

  return { adminA, adminB, regularUser };
}

// Clean up test data
export async function cleanupTestData(): Promise<void> {
  // In a test environment, we'll use a simpler approach to clean up
  // Instead of scanning, we'll just delete the specific keys we know we created
  const keysToDelete = [
    `tenant:${TEST_IDS.TENANT_A}`,
    `tenant:${TEST_IDS.TENANT_B}`,
    `user:${TEST_IDS.USER_ADMIN_A}`,
    `user:${TEST_IDS.USER_ADMIN_B}`,
    `user:${TEST_IDS.USER_REGULAR}`,
    `role:${TEST_IDS.ROLE_ADMIN_A}`,
    `role:${TEST_IDS.ROLE_ADMIN_B}`,
    `role:${TEST_IDS.ROLE_REGULAR}`,
    `tenant:${TEST_IDS.TENANT_A}:roles`,
    `tenant:${TEST_IDS.TENANT_B}:roles`,
    `user:${TEST_IDS.USER_ADMIN_A}:roles`,
    `user:${TEST_IDS.USER_ADMIN_B}:roles`,
    `user:${TEST_IDS.USER_REGULAR}:roles`
  ];

  // Delete each key individually to avoid issues if some don't exist
  for (const key of keysToDelete) {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn(`Failed to delete key ${key}:`, error);
    }
  }
}

// Create a mock NextRequest for testing
export function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  // Create a proper headers object with get and has methods
  const headersObj = {
    get: (name: string) => headers[name] || null,
    has: (name: string) => name in headers,
    // Add other methods that might be needed
    forEach: (callback: (value: string, key: string) => void) => {
      Object.entries(headers).forEach(([key, value]) => callback(value, key));
    },
    entries: () => Object.entries(headers)[Symbol.iterator](),
    keys: () => Object.keys(headers)[Symbol.iterator](),
    values: () => Object.values(headers)[Symbol.iterator]()
  };

  // Create the mock request with the headers object
  return {
    headers: headersObj,
    method: 'GET',
    url: 'http://localhost',
    nextUrl: new URL('http://localhost'),
    cookies: { get: () => null, getAll: () => [], has: () => false },
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    clone: () => createMockRequest(headers)
  } as unknown as NextRequest;
}
