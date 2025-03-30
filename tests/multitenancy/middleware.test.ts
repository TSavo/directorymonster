import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { NextResponse, NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { TenantService } from '@/lib/tenant';

// Mock the TenantService
jest.mock('@/lib/tenant', () => ({
  TenantService: {
    getTenantByHostname: jest.fn(),
    tenantsExist: jest.fn(),
    createDefaultTenant: jest.fn(),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe('Middleware', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Mock process.env
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    
    // Create mock request
    mockRequest = {
      nextUrl: {
        pathname: '/',
        hostname: 'example.com',
        searchParams: new URLSearchParams(),
      },
      url: 'https://example.com/',
      headers: new Headers(),
    } as unknown as NextRequest;
    
    // Mock NextResponse.next
    jest.spyOn(NextResponse, 'next').mockImplementation(() => {
      return {
        headers: new Headers(),
      } as unknown as NextResponse;
    });
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });
  
  it('should skip static assets', async () => {
    // Set up static asset paths
    const staticPaths = [
      '/_next/static/chunks/main.js',
      '/static/images/logo.png',
      '/images/banner.jpg',
      '/favicon.ico',
    ];
    
    for (const path of staticPaths) {
      mockRequest.nextUrl.pathname = path;
      await middleware(mockRequest);
      
      // Verify NextResponse.next was called without modification
      expect(NextResponse.next).toHaveBeenCalled();
    }
  });
  
  it('should add tenant info to headers when tenant is found', async () => {
    // Mock tenant data
    const mockTenant = {
      id: 'tenant-123',
      slug: 'test-tenant',
      name: 'Test Tenant',
      hostnames: ['example.com'],
      primaryHostname: 'example.com',
      theme: 'default',
      settings: {},
      active: true,
      createdAt: '2025-03-30T12:00:00Z',
      updatedAt: '2025-03-30T12:00:00Z',
    };
    
    // Mock TenantService.getTenantByHostname to return the tenant
    (TenantService.getTenantByHostname as jest.Mock).mockResolvedValue(mockTenant);
    
    // Create mock response headers to check later
    const mockHeaders = new Headers();
    (NextResponse.next as jest.Mock).mockReturnValue({
      headers: mockHeaders,
    });
    
    // Call middleware
    await middleware(mockRequest);
    
    // Verify TenantService was called with correct hostname
    expect(TenantService.getTenantByHostname).toHaveBeenCalledWith('example.com');
    
    // Verify headers were set correctly
    expect(mockHeaders.get('x-tenant-id')).toBe('tenant-123');
    expect(mockHeaders.get('x-tenant-slug')).toBe('test-tenant');
    expect(mockHeaders.get('x-tenant-name')).toBe('Test Tenant');
    expect(mockHeaders.get('x-hostname')).toBe('example.com');
  });
  
  it('should support debug hostname parameter', async () => {
    // Set up debug hostname
    mockRequest.nextUrl.searchParams = new URLSearchParams('hostname=debug.example.com');
    
    // Mock tenant data
    const mockTenant = {
      id: 'tenant-debug',
      slug: 'debug-tenant',
      name: 'Debug Tenant',
      hostnames: ['debug.example.com'],
      primaryHostname: 'debug.example.com',
      theme: 'default',
      settings: {},
      active: true,
      createdAt: '2025-03-30T12:00:00Z',
      updatedAt: '2025-03-30T12:00:00Z',
    };
    
    // Mock TenantService.getTenantByHostname to return the tenant
    (TenantService.getTenantByHostname as jest.Mock).mockResolvedValue(mockTenant);
    
    // Create mock response headers to check later
    const mockHeaders = new Headers();
    (NextResponse.next as jest.Mock).mockReturnValue({
      headers: mockHeaders,
    });
    
    // Call middleware
    await middleware(mockRequest);
    
    // Verify TenantService was called with debug hostname
    expect(TenantService.getTenantByHostname).toHaveBeenCalledWith('debug.example.com');
    
    // Verify debug hostname header was set
    expect(mockHeaders.get('x-debug-hostname')).toBe('debug.example.com');
    expect(mockHeaders.get('x-tenant-id')).toBe('tenant-debug');
  });
  
  it('should create default tenant for localhost in development', async () => {
    // Set up localhost hostname
    mockRequest.nextUrl.hostname = 'localhost';
    
    // Mock tenant lookup to return null (no tenant found)
    (TenantService.getTenantByHostname as jest.Mock).mockResolvedValue(null);
    
    // Mock tenantsExist to return false
    (TenantService.tenantsExist as jest.Mock).mockResolvedValue(false);
    
    // Mock createDefaultTenant
    const mockDefaultTenant = {
      id: 'default-tenant',
      slug: 'default',
      name: 'Default Tenant',
      hostnames: ['localhost', '127.0.0.1'],
      primaryHostname: 'localhost',
      theme: 'default',
      settings: {},
      active: true,
      createdAt: '2025-03-30T12:00:00Z',
      updatedAt: '2025-03-30T12:00:00Z',
    };
    (TenantService.createDefaultTenant as jest.Mock).mockResolvedValue(mockDefaultTenant);
    
    // Create mock response headers to check later
    const mockHeaders = new Headers();
    (NextResponse.next as jest.Mock).mockReturnValue({
      headers: mockHeaders,
    });
    
    // Call middleware
    await middleware(mockRequest);
    
    // Verify createDefaultTenant was called
    expect(TenantService.createDefaultTenant).toHaveBeenCalled();
    
    // Verify tenant-created header was set
    expect(mockHeaders.get('x-tenant-created')).toBe('true');
  });
  
  it('should handle admin paths when no tenant is found', async () => {
    // Set up admin path
    mockRequest.nextUrl.pathname = '/admin/dashboard';
    
    // Mock tenant lookup to return null (no tenant found)
    (TenantService.getTenantByHostname as jest.Mock).mockResolvedValue(null);
    
    // Mock tenantsExist to return true (tenants exist but none for this hostname)
    (TenantService.tenantsExist as jest.Mock).mockResolvedValue(true);
    
    // Mock NextResponse
    const mockResponse = { headers: new Headers() };
    (NextResponse.next as jest.Mock).mockReturnValue(mockResponse);
    
    // Call middleware
    const result = await middleware(mockRequest);
    
    // Verify we don't redirect or block admin paths
    expect(result).toBe(mockResponse);
  });
});
