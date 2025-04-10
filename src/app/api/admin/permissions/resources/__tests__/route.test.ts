import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the middleware
jest.mock('@/lib/middleware/withACL', () => ({
  withACL: (handler: any) => handler
}));

jest.mock('@/lib/middleware/withTenant', () => ({
  withTenant: (handler: any) => handler
}));

describe('Permission Resources API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns resources and actions', async () => {
    // Create a mock request
    const req = {} as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(200);
    expect(data.resources).toBeDefined();
    expect(data.actions).toBeDefined();
    
    // Check that resources include expected values
    expect(data.resources).toContain('user');
    expect(data.resources).toContain('role');
    expect(data.resources).toContain('site');
    
    // Check that actions include expected values
    expect(data.actions).toContain('create');
    expect(data.actions).toContain('read');
    expect(data.actions).toContain('update');
    expect(data.actions).toContain('delete');
  });

  it('handles errors gracefully', async () => {
    // Mock implementation to throw an error
    const originalResources = Array.prototype.filter;
    Array.prototype.filter = jest.fn(() => {
      throw new Error('Test error');
    }) as any;
    
    // Create a mock request
    const req = {} as NextRequest;
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check the response
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch permission resources');
    
    // Restore original implementation
    Array.prototype.filter = originalResources;
  });
});
