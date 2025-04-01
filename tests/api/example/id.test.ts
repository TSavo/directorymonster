import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/example/[id]/route';
import { withPermission } from '@/app/api/middleware';

// Mock the middleware
jest.mock('@/app/api/middleware', () => {
  return {
    withPermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
      return handler(req);
    })
  };
});

describe('Example API Routes with ID Parameter', () => {
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
      url: 'http://localhost:3000/api/example/cat-123',
      method,
      body,
      json: jest.fn().mockResolvedValue(body)
    } as unknown as NextRequest;
  };

  // Mock params
  const mockParams = { params: { id: 'cat-123' } };

  describe('GET', () => {
    it('should use permission middleware with correct parameters', async () => {
      const req = createMockRequest({ 'x-tenant-id': 'tenant-123' });
      
      await GET(req, mockParams);
      
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'category',
        'read',
        expect.any(Function)
      );
    });

    it('should return resource data with tenant ID', async () => {
      const req = createMockRequest({ 'x-tenant-id': 'tenant-123' });
      
      const response = await GET(req, mockParams) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully retrieved category cat-123 in tenant tenant-123',
        resourceId: 'cat-123',
        data: {
          id: 'cat-123',
          name: 'Example Category',
          description: 'This is a sample category',
          tenantId: 'tenant-123'
        },
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
      
      await PUT(req, mockParams);
      
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'category',
        'update',
        expect.any(Function)
      );
    });

    it('should return updated resource data with tenant ID', async () => {
      const requestBody = { name: 'Updated Category' };
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'PUT',
        requestBody
      );
      
      const response = await PUT(req, mockParams) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully updated category cat-123 in tenant tenant-123',
        resourceId: 'cat-123',
        data: {
          id: 'cat-123',
          ...requestBody,
          tenantId: 'tenant-123'
        },
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
      
      await DELETE(req, mockParams);
      
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'category',
        'delete',
        expect.any(Function)
      );
    });

    it('should return success response with tenant ID', async () => {
      const req = createMockRequest(
        { 'x-tenant-id': 'tenant-123' },
        'DELETE'
      );
      
      const response = await DELETE(req, mockParams) as NextResponse;
      const data = await response.json();
      
      expect(data).toEqual({
        message: 'Successfully deleted category cat-123 in tenant tenant-123',
        resourceId: 'cat-123',
        success: true
      });
    });
  });
});
