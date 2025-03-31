import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { TenantService, TenantConfig } from '@/lib/tenant';
import { redis, clearUsers } from '@/lib/redis-client';
import { KeyNamespaceService } from '@/lib/key-namespace-service';

describe('TenantService', () => {
  // Clear Redis before each test
  beforeEach(async () => {
    // Clear any existing tenants
    const tenantKeys = await redis.keys('tenant:*');
    const hostnameKeys = await redis.keys('hostname:*');
    const tenantIdKeys = await redis.keys('tenants:*');
    
    const allKeys = [...tenantKeys, ...hostnameKeys, ...tenantIdKeys];
    
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
  });
  
  // Helper to create a test tenant
  const createTestTenant = async (): Promise<TenantConfig> => {
    return await TenantService.createTenant({
      slug: 'test-tenant',
      name: 'Test Tenant',
      hostnames: ['test.example.com', 'test2.example.com'],
      primaryHostname: 'test.example.com',
      theme: 'default',
      settings: { testSetting: true },
      active: true,
    });
  };

  it('should create a tenant with proper data', async () => {
    const tenant = await createTestTenant();
    
    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    // Verify the ID is a valid UUID
    expect(KeyNamespaceService.isValidTenantId(tenant.id)).toBe(true);
    expect(tenant.slug).toBe('test-tenant');
    expect(tenant.name).toBe('Test Tenant');
    expect(tenant.hostnames).toContain('test.example.com');
    expect(tenant.hostnames).toContain('test2.example.com');
    expect(tenant.primaryHostname).toBe('test.example.com');
    expect(tenant.theme).toBe('default');
    expect(tenant.settings).toEqual({ testSetting: true });
    expect(tenant.active).toBe(true);
    expect(tenant.createdAt).toBeDefined();
    expect(tenant.updatedAt).toBeDefined();
  });

  it('should retrieve a tenant by ID', async () => {
    const tenant = await createTestTenant();
    const retrievedTenant = await TenantService.getTenantById(tenant.id);
    
    expect(retrievedTenant).toEqual(tenant);
  });

  it('should retrieve a tenant by hostname', async () => {
    const tenant = await createTestTenant();
    
    // Test primary hostname
    const byPrimary = await TenantService.getTenantByHostname('test.example.com');
    expect(byPrimary).toEqual(tenant);
    
    // Test secondary hostname
    const bySecondary = await TenantService.getTenantByHostname('test2.example.com');
    expect(bySecondary).toEqual(tenant);
    
    // Test normalized hostname (with www)
    const byNormalized = await TenantService.getTenantByHostname('www.test.example.com');
    expect(byNormalized).toEqual(tenant);
  });

  it('should update a tenant', async () => {
    const tenant = await createTestTenant();
    
    const updates = {
      name: 'Updated Test Tenant',
      settings: { testSetting: false, newSetting: true },
    };
    
    const updatedTenant = await TenantService.updateTenant(tenant.id, updates);
    
    expect(updatedTenant).toBeDefined();
    expect(updatedTenant!.name).toBe('Updated Test Tenant');
    expect(updatedTenant!.settings).toEqual({ testSetting: false, newSetting: true });
    
    // Make sure other properties are preserved
    expect(updatedTenant!.id).toBe(tenant.id);
    expect(updatedTenant!.slug).toBe(tenant.slug);
    expect(updatedTenant!.hostnames).toEqual(tenant.hostnames);
  });

  it('should update tenant hostnames', async () => {
    const tenant = await createTestTenant();
    
    const updates = {
      hostnames: ['test.example.com', 'new.example.com'],
    };
    
    const updatedTenant = await TenantService.updateTenant(tenant.id, updates);
    
    expect(updatedTenant).toBeDefined();
    expect(updatedTenant!.hostnames).toContain('test.example.com');
    expect(updatedTenant!.hostnames).toContain('new.example.com');
    expect(updatedTenant!.hostnames).not.toContain('test2.example.com');
    
    // Verify we can retrieve by the new hostname
    const byNewHostname = await TenantService.getTenantByHostname('new.example.com');
    expect(byNewHostname).toEqual(updatedTenant);
    
    // Verify we can't retrieve by the removed hostname
    const byRemovedHostname = await TenantService.getTenantByHostname('test2.example.com');
    expect(byRemovedHostname).toBeNull();
  });

  it('should delete a tenant', async () => {
    const tenant = await createTestTenant();
    
    const deleteResult = await TenantService.deleteTenant(tenant.id);
    expect(deleteResult).toBe(true);
    
    // Verify tenant is gone
    const retrievedTenant = await TenantService.getTenantById(tenant.id);
    expect(retrievedTenant).toBeNull();
    
    // Verify hostnames are gone
    const byHostname = await TenantService.getTenantByHostname('test.example.com');
    expect(byHostname).toBeNull();
  });

  it('should add and remove hostnames', async () => {
    const tenant = await createTestTenant();
    
    // Add hostname
    const withNewHostname = await TenantService.addHostname(tenant.id, 'added.example.com');
    expect(withNewHostname!.hostnames).toContain('added.example.com');
    
    // Verify we can retrieve by the new hostname
    const byNewHostname = await TenantService.getTenantByHostname('added.example.com');
    expect(byNewHostname).toEqual(withNewHostname);
    
    // Remove hostname
    const withoutHostname = await TenantService.removeHostname(tenant.id, 'test2.example.com');
    expect(withoutHostname!.hostnames).not.toContain('test2.example.com');
    
    // Verify we can't retrieve by the removed hostname
    const byRemovedHostname = await TenantService.getTenantByHostname('test2.example.com');
    expect(byRemovedHostname).toBeNull();
  });

  it('should correctly normalize hostnames', () => {
    // Test various hostname formats
    expect(TenantService.normalizeHostname('example.com')).toBe('example.com');
    expect(TenantService.normalizeHostname('www.example.com')).toBe('example.com');
    expect(TenantService.normalizeHostname('EXAMPLE.com')).toBe('example.com');
    expect(TenantService.normalizeHostname('http://example.com')).toBe('example.com');
    expect(TenantService.normalizeHostname('https://example.com')).toBe('example.com');
    expect(TenantService.normalizeHostname('https://www.example.com/')).toBe('example.com');
    expect(TenantService.normalizeHostname('example.com:3000')).toBe('example.com');
  });

  it('should create a default tenant for development', async () => {
    const defaultTenant = await TenantService.createDefaultTenant();
    
    expect(defaultTenant).toBeDefined();
    expect(defaultTenant.slug).toBe('default');
    expect(defaultTenant.hostnames).toContain('localhost');
    expect(defaultTenant.hostnames).toContain('127.0.0.1');
    
    // Verify we can retrieve it
    const byHostname = await TenantService.getTenantByHostname('localhost');
    expect(byHostname).toEqual(defaultTenant);
  });

  it('should prevent duplicate hostnames across tenants', async () => {
    await createTestTenant();
    
    // Try to create another tenant with overlapping hostname
    const createDuplicate = async () => {
      await TenantService.createTenant({
        slug: 'duplicate-tenant',
        name: 'Duplicate Tenant',
        hostnames: ['unique.example.com', 'test.example.com'],
        primaryHostname: 'unique.example.com',
        theme: 'default',
        settings: {},
        active: true,
      });
    };
    
    await expect(createDuplicate()).rejects.toThrow();
  });

  it('should validate tenant ID format', async () => {
    const tenant = await createTestTenant();
    
    // Verify valid UUID passes validation
    expect(KeyNamespaceService.isValidTenantId(tenant.id)).toBe(true);
    
    // Test invalid formats
    expect(KeyNamespaceService.isValidTenantId('invalid-id')).toBe(false);
    expect(KeyNamespaceService.isValidTenantId('123456')).toBe(false);
    expect(KeyNamespaceService.isValidTenantId('')).toBe(false);
    
    // Test with malicious input
    expect(KeyNamespaceService.isValidTenantId('../../etc/passwd')).toBe(false);
    expect(KeyNamespaceService.isValidTenantId('tenant:123;drop table users;')).toBe(false);
  });

  it('should reject lookups with invalid tenant IDs', async () => {
    // Try to retrieve a tenant with an invalid ID format
    const invalidIdResult = await TenantService.getTenantById('invalid-id-format');
    expect(invalidIdResult).toBeNull();
    
    // Special case: 'default' should be allowed despite not being a UUID
    const defaultTenant = await TenantService.createDefaultTenant();
    if (defaultTenant.id === 'default') {
      const retrievedDefault = await TenantService.getTenantById('default');
      expect(retrievedDefault).not.toBeNull();
    }
  });
});
