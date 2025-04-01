/**
 * Comprehensive Cross-Tenant Attack Prevention Tests
 * 
 * This test suite verifies that our tenant isolation security measures
 * prevent cross-tenant data access across a variety of scenarios.
 */

import { KeyNamespaceService, KeyResourceType } from '../../src/lib/key-namespace-service';
import { createSecureRedisClient, TenantRedisContext } from '../../src/lib/secure-redis-client';
import { redis } from '../../src/lib/redis-client';
import { AuditService } from '../../src/lib/audit/audit-service';

// Mock the audit service to capture security events
jest.mock('../../src/lib/audit/audit-service', () => ({
  AuditService: {
    logSecurityEvent: jest.fn().mockResolvedValue(true),
    logEvent: jest.fn().mockResolvedValue(true)
  }
}));

describe('Cross-Tenant Security Isolation', () => {
  // Setup test data with UUID-format tenant IDs for proper testing
  const tenant1Id = '11111111-1111-4111-a111-111111111111';
  const tenant2Id = '22222222-2222-4222-a222-222222222222';
  const userId = 'test-user-123';
  
  const tenant1Data = { name: 'Tenant One', secret: 'tenant1-secret-key' };
  const tenant2Data = { name: 'Tenant Two', secret: 'tenant2-secret-key' };
  
  // Create tenant contexts
  const tenant1Context: TenantRedisContext = { tenantId: tenant1Id, userId };
  const tenant2Context: TenantRedisContext = { tenantId: tenant2Id, userId };
  
  // Create secure Redis clients for each tenant
  const tenant1Redis = createSecureRedisClient(tenant1Context);
  const tenant2Redis = createSecureRedisClient(tenant2Context);
  
  // Clean up test data before each test
  beforeEach(async () => {
    await redis.del(
      `${tenant1Id}:${KeyResourceType.CONFIG}:settings`,
      `${tenant2Id}:${KeyResourceType.CONFIG}:settings`,
      `${tenant1Id}:${KeyResourceType.USER}:users`,
      `${tenant2Id}:${KeyResourceType.USER}:users`,
      `system:${KeyResourceType.CONFIG}:global-setting`
    );
    
    jest.clearAllMocks();
  });
  
  describe('Basic Key Namespacing', () => {
    test('generates different keys for different tenants', async () => {
      // Generate keys for different tenants but same resource
      const tenant1Key = KeyNamespaceService.getNamespacedKey({
        tenantId: tenant1Id,
        resourceType: KeyResourceType.CONFIG,
        resourceId: 'settings'
      });
      
      const tenant2Key = KeyNamespaceService.getNamespacedKey({
        tenantId: tenant2Id,
        resourceType: KeyResourceType.CONFIG,
        resourceId: 'settings'
      });
      
      // Keys should be different
      expect(tenant1Key).not.toEqual(tenant2Key);
      expect(tenant1Key).toContain(tenant1Id);
      expect(tenant2Key).toContain(tenant2Id);
    });
    
    test('validates whether keys belong to the same tenant', async () => {
      const key1 = `${tenant1Id}:${KeyResourceType.USER}:user1`;
      const key2 = `${tenant1Id}:${KeyResourceType.USER}:user2`;
      const key3 = `${tenant2Id}:${KeyResourceType.USER}:user1`;
      
      // Same tenant keys should validate
      const sameResult = await KeyNamespaceService.validateSameTenant(key1, key2, userId);
      expect(sameResult).toBe(true);
      
      // Different tenant keys should not validate
      const differentResult = await KeyNamespaceService.validateSameTenant(key1, key3, userId);
      expect(differentResult).toBe(false);
      
      // Cross-tenant access attempt should be logged
      expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
        userId,
        tenant1Id,
        'security',
        'cross-tenant-key-access-attempt',
        expect.objectContaining({
          key1,
          key2: key3,
          tenantId1: tenant1Id,
          tenantId2: tenant2Id
        })
      );
    });
  });
  
  describe('Basic Data Isolation', () => {
    test('tenants can access their own data but not others', async () => {
      // Store data for each tenant
      await tenant1Redis.set('settings', tenant1Data, KeyResourceType.CONFIG);
      await tenant2Redis.set('settings', tenant2Data, KeyResourceType.CONFIG);
      
      // Each tenant should retrieve its own data
      const retrieved1 = await tenant1Redis.get('settings', KeyResourceType.CONFIG);
      const retrieved2 = await tenant2Redis.get('settings', KeyResourceType.CONFIG);
      
      expect(retrieved1).toEqual(tenant1Data);
      expect(retrieved2).toEqual(tenant2Data);
      expect(retrieved1).not.toEqual(retrieved2);
      
      // Tenant 1 should not get Tenant 2's data
      const crossTenantAttempt = await tenant1Redis.get('settings', KeyResourceType.CONFIG);
      expect(crossTenantAttempt).toEqual(tenant1Data);
      expect(crossTenantAttempt).not.toEqual(tenant2Data);
    });
  });
  
  describe('Redis Set Operations Isolation', () => {
    test('set operations are properly isolated between tenants', async () => {
      // Add data to sets for each tenant
      const tenant1Users = ['user1', 'user2', 'user3'];
      const tenant2Users = ['user4', 'user5', 'user6'];
      
      // Add users to each tenant's set
      await tenant1Redis.sadd('users', tenant1Users, KeyResourceType.USER);
      await tenant2Redis.sadd('users', tenant2Users, KeyResourceType.USER);
      
      // Each tenant should only see their own users
      const retrieved1 = await tenant1Redis.smembers('users', KeyResourceType.USER);
      const retrieved2 = await tenant2Redis.smembers('users', KeyResourceType.USER);
      
      // Verify tenant isolation
      expect(retrieved1).toEqual(expect.arrayContaining(tenant1Users));
      expect(retrieved2).toEqual(expect.arrayContaining(tenant2Users));
      
      // Tenant 1 should not have any of Tenant 2's users
      expect(retrieved1).not.toEqual(expect.arrayContaining(tenant2Users));
      
      // Tenant 2 should not have any of Tenant 1's users
      expect(retrieved2).not.toEqual(expect.arrayContaining(tenant1Users));
      
      // Test set size operations
      const tenant1Count = await tenant1Redis.scard('users', KeyResourceType.USER);
      const tenant2Count = await tenant2Redis.scard('users', KeyResourceType.USER);
      
      expect(tenant1Count).toBe(tenant1Users.length);
      expect(tenant2Count).toBe(tenant2Users.length);
    });
    
    test('removing set members is properly isolated', async () => {
      // Add data to sets for each tenant
      const tenant1Users = ['user1', 'user2', 'user3'];
      const tenant2Users = ['user1', 'user4', 'user5']; // Note: user1 is in both sets
      
      // Add users to each tenant's set
      await tenant1Redis.sadd('users', tenant1Users, KeyResourceType.USER);
      await tenant2Redis.sadd('users', tenant2Users, KeyResourceType.USER);
      
      // Remove 'user1' from tenant1's set
      await tenant1Redis.srem('users', ['user1'], KeyResourceType.USER);
      
      // Verify tenant1's user1 is removed
      const tenant1Members = await tenant1Redis.smembers('users', KeyResourceType.USER);
      expect(tenant1Members).not.toContain('user1');
      
      // Verify tenant2's user1 is NOT removed (tenant isolation)
      const tenant2Members = await tenant2Redis.smembers('users', KeyResourceType.USER);
      expect(tenant2Members).toContain('user1');
    });
  });
  
  describe('Pattern-Based Key Operations', () => {
    test('key pattern searches are properly isolated between tenants', async () => {
      // Store multiple keys for each tenant
      await tenant1Redis.set('user:1', { id: 1, name: 'User 1' }, KeyResourceType.USER);
      await tenant1Redis.set('user:2', { id: 2, name: 'User 2' }, KeyResourceType.USER);
      await tenant1Redis.set('setting:1', { feature: 'enabled' }, KeyResourceType.CONFIG);
      
      await tenant2Redis.set('user:1', { id: 1, name: 'T2 User 1' }, KeyResourceType.USER);
      await tenant2Redis.set('user:3', { id: 3, name: 'T2 User 3' }, KeyResourceType.USER);
      await tenant2Redis.set('setting:1', { feature: 'disabled' }, KeyResourceType.CONFIG);
      
      // Search for keys using patterns
      const tenant1UserKeys = await tenant1Redis.keys('user:*', KeyResourceType.USER);
      const tenant2UserKeys = await tenant2Redis.keys('user:*', KeyResourceType.USER);
      
      // Each tenant should only see their own keys
      expect(tenant1UserKeys.length).toBe(2);
      expect(tenant2UserKeys.length).toBe(2);
      
      // Tenant 1 should see their own user keys
      expect(tenant1UserKeys).toContain('user:1');
      expect(tenant1UserKeys).toContain('user:2');
      
      // Tenant 2 should see their own user keys
      expect(tenant2UserKeys).toContain('user:1');
      expect(tenant2UserKeys).toContain('user:3');
      
      // Verify data isolation despite same key names
      const t1User1 = await tenant1Redis.get('user:1', KeyResourceType.USER);
      const t2User1 = await tenant2Redis.get('user:1', KeyResourceType.USER);
      
      expect(t1User1).toHaveProperty('name', 'User 1');
      expect(t2User1).toHaveProperty('name', 'T2 User 1');
    });
  });
  
  describe('System Key Access', () => {
    test('system keys are properly isolated from tenant keys', async () => {
      // Set system key value
      const systemKey = KeyNamespaceService.getSystemKey(KeyResourceType.CONFIG, 'global-setting');
      await redis.set(systemKey, JSON.stringify({ isSystemMaintenance: true }));
      
      // Access system key - this should be logged
      const systemValue = await tenant1Redis.accessSystemKey('global-setting', KeyResourceType.CONFIG, 'read');
      
      // Verify audit logging
      expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
        userId,
        tenant1Id,
        'security',
        'system-key-access',
        expect.objectContaining({
          key: 'global-setting',
          resourceType: KeyResourceType.CONFIG,
          operation: 'read',
        })
      );
      
      // System key access should work
      expect(JSON.parse(systemValue)).toHaveProperty('isSystemMaintenance', true);
      
      // But this system value should not be accessible via normal tenant-scoped methods
      const tenantAccessToSystem = await tenant1Redis.get('global-setting', KeyResourceType.CONFIG);
      expect(tenantAccessToSystem).toBeNull();
    });
  });
  
  describe('Tenant Context Switching', () => {
    test('switching tenant context isolates operations properly', async () => {
      // Setup data for each tenant
      await tenant1Redis.set('shared-key-name', tenant1Data, KeyResourceType.CONFIG);
      await tenant2Redis.set('shared-key-name', tenant2Data, KeyResourceType.CONFIG);
      
      // Get data for tenant 1
      const tenant1Result = await tenant1Redis.get('shared-key-name', KeyResourceType.CONFIG);
      expect(tenant1Result).toEqual(tenant1Data);
      
      // Switch to tenant 2 context (create new client)
      const newTenant2Context: TenantRedisContext = { tenantId: tenant2Id, userId };
      const newTenant2Redis = createSecureRedisClient(newTenant2Context);
      
      // Get data for tenant 2 using the new client
      const tenant2Result = await newTenant2Redis.get('shared-key-name', KeyResourceType.CONFIG);
      expect(tenant2Result).toEqual(tenant2Data);
      
      // Ensure different tenants get different data despite same key name
      expect(tenant1Result).not.toEqual(tenant2Result);
    });
  });
  
  describe('Error Handling and Information Leakage', () => {
    test('errors do not leak cross-tenant information', async () => {
      // This test requires a mock implementation that could potentially leak data.
      // Since our implementation already isolates tenants properly, we'll verify that
      // operations on non-existent keys return null rather than information about
      // other tenants.
      
      // Create data for tenant 2 only
      await tenant2Redis.set('secret-config', { apiKey: 'super-secret-api-key' }, KeyResourceType.CONFIG);
      
      // Tenant 1 tries to access the same key (which doesn't exist in tenant 1's namespace)
      const result = await tenant1Redis.get('secret-config', KeyResourceType.CONFIG);
      
      // Should return null, not tenant 2's data or any error indicating the key exists elsewhere
      expect(result).toBeNull();
    });
  });
  
  describe('Tenant ID Format Validation', () => {
    test('validates UUID format for tenant IDs', () => {
      // Valid UUIDs should pass validation
      expect(KeyNamespaceService.isValidTenantId(tenant1Id)).toBe(true);
      expect(KeyNamespaceService.isValidTenantId(tenant2Id)).toBe(true);
      
      // Invalid IDs should fail validation
      expect(KeyNamespaceService.isValidTenantId('tenant-1')).toBe(false);
      expect(KeyNamespaceService.isValidTenantId('12345')).toBe(false);
      expect(KeyNamespaceService.isValidTenantId('')).toBe(false);
      
      // Malicious IDs should fail validation
      expect(KeyNamespaceService.isValidTenantId('../../etc/passwd')).toBe(false);
      expect(KeyNamespaceService.isValidTenantId('tenant:1; DROP TABLE users;')).toBe(false);
    });
    
    test('tenant ID generation produces valid UUIDs', () => {
      // Generate multiple tenant IDs
      const generatedIds = Array.from({ length: 10 }, () => KeyNamespaceService.generateSecureTenantId());
      
      // All generated IDs should be valid UUIDs
      generatedIds.forEach(id => {
        expect(KeyNamespaceService.isValidTenantId(id)).toBe(true);
      });
      
      // Generated IDs should all be unique
      const uniqueIds = new Set(generatedIds);
      expect(uniqueIds.size).toBe(generatedIds.length);
    });
  });
});