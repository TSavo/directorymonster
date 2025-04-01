/**
 * Cross-Tenant Attack Prevention Test
 * 
 * This script tests the key namespacing and tenant isolation functionality
 * to verify that our security measures prevent cross-tenant data access.
 */

import { KeyNamespaceService, KeyResourceType } from '../../src/lib/key-namespace-service';
import { createSecureRedisClient, TenantRedisContext } from '../../src/lib/secure-redis-client';
import { redis } from '../../src/lib/redis-client';

// Use jest test framework
describe('Cross-Tenant Attack Prevention', () => {
  // Setup test data
  const tenant1Id = 'tenant-1';
  const tenant2Id = 'tenant-2';
  const userId = 'test-user-123';
  
  const tenant1Data = { name: 'Tenant One', secret: 'tenant1-secret-key' };
  const tenant2Data = { name: 'Tenant Two', secret: 'tenant2-secret-key' };
  
  // Create tenant contexts
  const tenant1Context: TenantRedisContext = { tenantId: tenant1Id, userId };
  const tenant2Context: TenantRedisContext = { tenantId: tenant2Id, userId };
  
  // Create secure Redis clients for each tenant
  const tenant1Redis = createSecureRedisClient(tenant1Context);
  const tenant2Redis = createSecureRedisClient(tenant2Context);
  
  // Clean up after all tests
  afterAll(async () => {
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
    
    await redis.del(tenant1Key, tenant2Key);
  });
  
  test('KeyNamespaceService generates tenant-isolated keys', async () => {
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
    
    expect(tenant1Key).not.toEqual(tenant2Key);
    expect(tenant1Key).toContain(tenant1Id);
    expect(tenant2Key).toContain(tenant2Id);
  });
  
  test('SecureRedisClient properly isolates tenant data', async () => {
    // Store data for each tenant
    await tenant1Redis.set('settings', tenant1Data, KeyResourceType.CONFIG);
    await tenant2Redis.set('settings', tenant2Data, KeyResourceType.CONFIG);
    
    // Retrieve data for each tenant using their own clients
    const retrievedTenant1Data = await tenant1Redis.get('settings', KeyResourceType.CONFIG);
    const retrievedTenant2Data = await tenant2Redis.get('settings', KeyResourceType.CONFIG);
    
    expect(retrievedTenant1Data).toEqual(tenant1Data);
    expect(retrievedTenant2Data).toEqual(tenant2Data);
  });
  
  test('SecureRedisClient prevents cross-tenant access', async () => {
    // Try to retrieve Tenant 2's data using Tenant 1's client with the same key name
    const crossTenantAttempt = await tenant1Redis.get('settings', KeyResourceType.CONFIG);
    
    // This should return Tenant 1's data, not Tenant 2's
    expect(crossTenantAttempt).toEqual(tenant1Data);
    expect(crossTenantAttempt).not.toEqual(tenant2Data);
  });
  
  test('KeyNamespaceService correctly validates tenant boundaries', async () => {
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
    
    const sameTenantsResult = await KeyNamespaceService.validateSameTenant(tenant1Key, tenant1Key);
    const differentTenantsResult = await KeyNamespaceService.validateSameTenant(tenant1Key, tenant2Key);
    
    expect(sameTenantsResult).toBe(true);
    expect(differentTenantsResult).toBe(false);
  });
});