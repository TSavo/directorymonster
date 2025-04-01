import { NextRequest } from 'next/server';
import { GET } from '../route';
import AuditService from '@/lib/audit/audit-service';
import { withPermission } from '../../../middleware/withPermission';
import RoleService from '@/lib/role-service';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/audit/audit-service', () => ({
  queryEvents: jest.fn()
}));
jest.mock('../../../middleware/withPermission');
jest.mock('@/lib/role-service');
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
  verify: jest.fn() // Add verify mock since we now use it
}));

describe('Audit Stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock withPermission to call the handler with a validated request
    (withPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => handler(req)
    );
    
    // Mock verify to return the same as decode for test compatibility
    jwt.verify = jwt.decode;
  });
  
  it('should return audit statistics for tenant', async () => {
    // Mock request
    const req = new NextRequest(
      new URL('https://example.com/api/audit/stats?days=30'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jwt.decode.mockReturnValue({ userId: 'user-123' });
    
    // Mock RoleService
    (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
    
    // Mock AuditService
    const mockEvents = [
      {
        id: 'event-1',
        timestamp: '2023-01-01T12:00:00Z',
        userId: 'user-123',
        tenantId: 'tenant-123',
        action: 'access_granted',
        severity: 'info',
        resourceType: 'user',
        success: true
      },
      {
        id: 'event-2',
        timestamp: '2023-01-02T12:00:00Z',
        userId: 'user-456',
        tenantId: 'tenant-123',
        action: 'access_denied',
        severity: 'warning',
        resourceType: 'category',
        success: false
      }
    ];
    (AuditService.queryEvents as jest.Mock).mockResolvedValue(mockEvents);
    
    // Call the handler
    const response = await GET(req);
    const data = await response.json();
    
    // Check that withPermission was called
    expect(withPermission).toHaveBeenCalledWith(
      req,
      'audit',
      'read',
      expect.any(Function)
    );
    
    // Check that AuditService.queryEvents was called with correct parameters
    // Updated to match our new default limit of 5000 instead of 10000
    expect(AuditService.queryEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-123',
        startDate: expect.any(String),
        endDate: expect.any(String),
        limit: 5000 // Updated from 10000 to match implementation
      }),
      'tenant-123',
      false
    );
    
    // Check response status
    expect(response.status).toBe(200);
    
    // Check response contains stats object
    expect(data.stats).toBeDefined();
  });
  
  it('should use default date range if not specified', async () => {
    // Mock request without days parameter
    const req = new NextRequest(
      new URL('https://example.com/api/audit/stats'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jwt.decode.mockReturnValue({ userId: 'user-123' });
    
    // Mock RoleService
    (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
    
    // Mock AuditService
    (AuditService.queryEvents as jest.Mock).mockResolvedValue([]);
    
    // Call the handler
    await GET(req);
    
    // Check that AuditService.queryEvents was called with default 30 days
    expect(AuditService.queryEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-123',
        startDate: expect.any(String),
        endDate: expect.any(String),
        limit: 5000 // Updated to match implementation
      }),
      'tenant-123',
      false
    );
  });
  
  it('should allow global admins to get stats across tenants', async () => {
    // Mock request
    const req = new NextRequest(
      new URL('https://example.com/api/audit/stats'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jwt.decode.mockReturnValue({ userId: 'admin-user' });
    
    // Mock RoleService - user is global admin
    (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(true);
    
    // Mock AuditService
    (AuditService.queryEvents as jest.Mock).mockResolvedValue([]);
    
    // Call the handler
    await GET(req);
    
    // Check that AuditService.queryEvents was called with isGlobalAdmin=true
    expect(AuditService.queryEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5000 // Add this to match implementation
      }),
      'tenant-123',
      true
    );
  });
  
  it('should handle errors gracefully', async () => {
    // Mock request
    const req = new NextRequest(
      new URL('https://example.com/api/audit/stats'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jwt.decode.mockReturnValue({ userId: 'user-123' });
    
    // Mock RoleService
    (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
    
    // Mock AuditService to throw error
    (AuditService.queryEvents as jest.Mock).mockRejectedValue(new Error('Test error'));
    
    // Call the handler
    const response = await GET(req);
    
    // Check response is error
    expect(response.status).toBe(500);
  });
});
