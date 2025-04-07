import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the middleware
jest.mock('@/lib/middleware/withACL', () => ({
  withACL: (handler: any) => handler
}));

jest.mock('@/lib/middleware/withTenant', () => ({
  withTenant: (handler: any) => handler
}));

describe('Permission Templates API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all tenant-wide templates when scope is tenant', async () => {
    // Create a mock request with tenant scope
    const req = {
      url: 'http://localhost:3000/api/admin/roles/wizard/templates?scope=tenant'
    } as unknown as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    expect(data.templates.length).toBeGreaterThan(0);
    
    // All templates should have tenant scope
    expect(data.templates.every((template: any) => template.scope === 'tenant')).toBe(true);
  });

  it('returns site-specific templates when scope is site', async () => {
    // Create a mock request with site scope
    const req = {
      url: 'http://localhost:3000/api/admin/roles/wizard/templates?scope=site'
    } as unknown as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    expect(data.templates.length).toBeGreaterThan(0);
    
    // All templates should have site scope
    expect(data.templates.every((template: any) => template.scope === 'site')).toBe(true);
  });

  it('filters templates by siteId when provided', async () => {
    const siteId = 'site-123';
    
    // Create a mock request with site scope and siteId
    const req = {
      url: `http://localhost:3000/api/admin/roles/wizard/templates?scope=site&siteId=${siteId}`
    } as unknown as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    
    // All templates should have site scope
    expect(data.templates.every((template: any) => template.scope === 'site')).toBe(true);
    
    // Templates with specific siteId should be filtered out
    expect(data.templates.every((template: any) => !template.siteId || template.siteId === siteId)).toBe(true);
  });

  it('defaults to tenant scope when scope is not provided', async () => {
    // Create a mock request without scope
    const req = {
      url: 'http://localhost:3000/api/admin/roles/wizard/templates'
    } as unknown as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    expect(data.templates.length).toBeGreaterThan(0);
    
    // All templates should have tenant scope
    expect(data.templates.every((template: any) => template.scope === 'tenant')).toBe(true);
  });

  it('handles errors gracefully', async () => {
    // Mock URL.searchParams.get to throw an error
    const originalURL = global.URL;
    global.URL = jest.fn(() => {
      throw new Error('Test error');
    }) as any;
    
    // Create a mock request
    const req = {
      url: 'http://localhost:3000/api/admin/roles/wizard/templates'
    } as unknown as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch permission templates');
    
    // Restore global.URL
    global.URL = originalURL;
  });
});
