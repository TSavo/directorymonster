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

export interface TestUser {
  id: string;
  token: string;
}

export interface TestTenant {
  id: string;
  name: string;
  hostname: string;
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
    hostname: 'tenant-a-test.example.com'
  });

  const tenantB = await TenantService.createTenant({
    id: TEST_IDS.TENANT_B,
    name: 'Test Tenant B',
    hostname: 'tenant-b-test.example.com'
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
  // Scan for all keys related to the test
  const pattern = `*test*`;
  const keys = await scanKeys(pattern);

  // Delete all matching keys
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Helper to scan Redis keys
async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== '0');

  return keys;
}

// Create a mock NextRequest for testing
export function createMockRequest(url: string = 'http://localhost', options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}): NextRequest {
  const { method = 'GET', headers = {}, body = undefined } = options;

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
  const mockRequest = {
    headers: headersObj,
    method,
    url,
    nextUrl: new URL(url.startsWith('http') ? url : `http://localhost${url}`),
    cookies: { get: () => null, getAll: () => [], has: () => false },
    json: async () => body || {},
    text: async () => body ? JSON.stringify(body) : '',
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    clone: () => createMockRequest(url, { method, headers, body })
  } as unknown as NextRequest;

  return mockRequest;
}
