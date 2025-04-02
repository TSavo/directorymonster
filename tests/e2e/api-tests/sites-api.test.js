/**
 * E2E Tests for Sites API
 * 
 * Tests the functionality of the Sites API endpoints, including
 * authentication, authorization, and multi-tenant isolation.
 */

const ApiTestBase = require('./api-test-base');

describe('Sites API', () => {
  let apiTest;
  
  beforeAll(async () => {
    apiTest = new ApiTestBase();
    await apiTest.setupTestData();
  });
  
  test('GET /api/sites should return sites with proper authentication', async () => {
    // Arrange
    const authOptions = {
      permissions: [{ resource: 'site', action: 'read' }]
    };
    
    // Act
    const response = await apiTest.authenticatedGet('/api/sites', authOptions);
    
    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // We expect at least one site to be returned from test data
    expect(response.body.length).toBeGreaterThan(0);
    // Check the structure of the first site object
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('slug');
      expect(response.body[0]).toHaveProperty('name');
    }
  });
  
  test('GET /api/sites should return 401 without authentication', async () => {
    // Act
    const response = await apiTest.request.get('/api/sites');
    
    // Assert
    expect(response.status).toBe(401);
  });
  
  test('GET /api/sites should return 403 with insufficient permissions', async () => {
    // Arrange - User with permissions to listings but not sites
    const authOptions = {
      permissions: [{ resource: 'listing', action: 'read' }]
    };
    
    // Act
    const response = await apiTest.authenticatedGet('/api/sites', authOptions);
    
    // Assert
    expect(response.status).toBe(403);
  });
  
  test('POST /api/sites should create a new site with proper authentication', async () => {
    // Arrange
    const authOptions = {
      permissions: [{ resource: 'site', action: 'create' }]
    };
    
    const siteId = Date.now().toString();
    const newSite = {
      name: `Test Site ${siteId}`,
      slug: `test-site-${siteId}`,
      domain: `test-${siteId}.example.com`,
      primaryKeyword: 'test site'
    };
    
    // Act
    const response = await apiTest.authenticatedPost('/api/sites', newSite, authOptions);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newSite.name);
    expect(response.body.slug).toBe(newSite.slug);
  });
  
  test('POST /api/sites should return 403 with insufficient permissions', async () => {
    // Arrange - User with read but not create permissions
    const authOptions = {
      permissions: [{ resource: 'site', action: 'read' }]
    };
    
    const siteId = Date.now().toString();
    const newSite = {
      name: `Test Site ${siteId}`,
      slug: `test-site-${siteId}`,
      domain: `test-${siteId}.example.com`
    };
    
    // Act
    const response = await apiTest.authenticatedPost('/api/sites', newSite, authOptions);
    
    // Assert
    expect(response.status).toBe(403);
  });
});
