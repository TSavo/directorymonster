/**
 * E2E Tests for Multi-Tenant Isolation
 * 
 * Tests the security boundaries between tenants to ensure
 * proper isolation of resources and data.
 */

const ApiTestBase = require('./api-test-base');

describe('Tenant Isolation', () => {
  let apiTest;
  
  beforeAll(async () => {
    apiTest = new ApiTestBase();
    await apiTest.setupTestData();
  });
  
  test('User should not access sites from another tenant', async () => {
    // Arrange - Create a site in tenant1
    const tenant1Id = 'tenant1';
    const tenant2Id = 'tenant2';
    
    const tenant1Options = {
      tenantId: tenant1Id,
      permissions: [{ resource: 'site', action: 'create' }]
    };
    
    const siteId = Date.now().toString();
    const newSite = {
      name: `Tenant1 Site ${siteId}`,
      slug: `tenant1-site-${siteId}`,
      domain: `tenant1-${siteId}.example.com`,
      primaryKeyword: 'tenant1 test'
    };
    
    // Create site in tenant1
    const createResponse = await apiTest.authenticatedPost('/api/sites', newSite, tenant1Options);
    expect(createResponse.status).toBe(201);
    
    // Get the site slug for later access
    const siteSlug = createResponse.body.slug;
    
    // Act - Try to access the site with tenant2 credentials
    const tenant2Options = {
      tenantId: tenant2Id,
      permissions: [{ resource: 'site', action: 'read' }]
    };
    
    const getSpecificSiteResponse = await apiTest.authenticatedGet(`/api/sites/${siteSlug}`, tenant2Options);
    
    // Assert - Should be forbidden or not found
    expect([403, 404]).toContain(getSpecificSiteResponse.status);
    
    // Also test listing all sites - should not include the site from tenant1
    const listSitesResponse = await apiTest.authenticatedGet('/api/sites', tenant2Options);
    expect(listSitesResponse.status).toBe(200);
    
    // Make sure the tenant1 site is not in the results
    const hasTenant1Site = listSitesResponse.body.some(site => site.slug === siteSlug);
    expect(hasTenant1Site).toBe(false);
  });
  
  test('User should not modify sites from another tenant', async () => {
    // Arrange - Create a site in tenant1
    const tenant1Id = 'tenant1';
    const tenant2Id = 'tenant2';
    
    const tenant1Options = {
      tenantId: tenant1Id,
      permissions: [
        { resource: 'site', action: 'create' },
        { resource: 'site', action: 'read' }
      ]
    };
    
    const siteId = Date.now().toString();
    const newSite = {
      name: `Tenant1 Site ${siteId}`,
      slug: `tenant1-site-${siteId}`,
      domain: `tenant1-${siteId}.example.com`,
      primaryKeyword: 'tenant1 test'
    };
    
    // Create site in tenant1
    const createResponse = await apiTest.authenticatedPost('/api/sites', newSite, tenant1Options);
    expect(createResponse.status).toBe(201);
    
    // Get the site slug
    const siteSlug = createResponse.body.slug;
    
    // Act - Try to modify the site with tenant2 credentials
    const tenant2Options = {
      tenantId: tenant2Id,
      permissions: [{ resource: 'site', action: 'update' }]
    };
    
    const updateData = {
      name: 'Updated by Tenant2',
      primaryKeyword: 'hacked'
    };
    
    const updateResponse = await apiTest.authenticatedPut(`/api/sites/${siteSlug}`, updateData, tenant2Options);
    
    // Assert - Should be forbidden or not found
    expect([403, 404]).toContain(updateResponse.status);
    
    // Verify the site was not modified by checking with tenant1
    const getResponse = await apiTest.authenticatedGet(`/api/sites/${siteSlug}`, tenant1Options);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe(newSite.name);
    expect(getResponse.body.name).not.toBe(updateData.name);
  });
});
