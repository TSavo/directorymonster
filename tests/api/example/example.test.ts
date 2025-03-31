import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/example/route';
import { withTenantAccess, withPermission } from '@/app/api/middleware';

// Mock the middleware
jest.mock('@/app/api/middleware', () => {
  return {
    withTenantAccess: jest.fn().mockImplementation((req, handler) => {
      return handler(req);
    }),
    withPermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
      return handler(req);
    })
  };
});

describe('Example API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock NextRequest
  const createMockRequest = (
    headers: Record<string, string> = {},
    method = 'GET',
    body?: any
  ) => {
    return {
      headers: {
        get: jest.fn().mockImplementation((name) => headers[name] || null),
      },
      url: 'http://localhost:3000/api/example',
      method,
      body,
      json: jest.fn().mockResolvedValue(body)
    } as unknown as NextRequest;
  };

  describe('GET', () => {
    it('should use tenant access middleware', async () => {
      const req = createMockRequest({ 'x-tenant-id': 'tenant-123' });
      
      await GET(req);
      
      expect(withTenantAccess).toHaveBeenCalledWith(req, expect.any(Function));
    });

    it('should return successful response with tenant ID', async () => {
      const req = createMockRequest({ 'x-tenant-id': 'tenant-123' });
      
      const response = await GET(req) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully accessed tenant tenant-123',
        success: true
      });
    });
  });

  describe('POST', () => {
    it('should use permission middleware with correct parameters', async () => {
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'POST',
        { name: 'New Category' }
      );
      
      await POST(req);
      
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'category',
        'create',
        expect.any(Function)
      );
    });

    it('should return successful response with tenant ID and data', async () => {
      const requestBody = { name: 'New Category' };
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'POST',
        requestBody
      );
      
      const response = await POST(req) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully created category in tenant tenant-123',
        data: requestBody,
        success: true
      });
    });
  });

  describe('PUT', () => {
    it('should use permission middleware with correct parameters', async () => {
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'PUT',
        { name: 'Updated Category' }
      );
      
      // Mock URL to include resource ID
      req.url = 'http://localhost:3000/api/example/cat-123';
      
      await PUT(req);
      
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'category',
        'update',
        expect.any(Function)
      );
    });

    it('should return successful response with tenant ID, resource ID and data', async () => {
      const requestBody = { name: 'Updated Category' };
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'PUT',
        requestBody
      );
      
      // Mock URL to include resource ID
      req.url = 'http://localhost:3000/api/example/cat-123';
      
      const response = await PUT(req) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully updated category cat-123 in tenant tenant-123',
        resourceId: 'cat-123',
        data: requestBody,
        success: true
      });
    });
  });

  describe('DELETE', () => {
    it('should use permission middleware with correct parameters', async () => {
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'DELETE'
      );
      
      // Mock URL to include resource ID
      req.url = 'http://localhost:3000/api/example/cat-123';
      
      await DELETE(req);
      
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'category',
        'delete',
        expect.any(Function)
      );
    });

    it('should return successful response with tenant ID and resource ID', async () => {
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'DELETE'
      );
      
      // Mock URL to include resource ID
      req.url = 'http://localhost:3000/api/example/cat-123';
      
      const response = await DELETE(req) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully deleted category cat-123 in tenant tenant-123',
        resourceId: 'cat-123',
        success: true
      });
    });
  });
});