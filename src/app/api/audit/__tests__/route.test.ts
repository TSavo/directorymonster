import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import AuditService from '@/lib/audit/audit-service';
import { withPermission } from '../../middleware/withPermission';
import RoleService from '@/lib/role-service';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/audit/audit-service', () => ({
  queryEvents: jest.fn(),
  logEvent: jest.fn()
}));
jest.mock('../../middleware/withPermission');
jest.mock('@/lib/role-service');
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

describe('Audit API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock withPermission to call the handler with a validated request
    (withPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => handler(req)
    );
  });
  
  describe('GET /api/audit', () => {
    it('should return audit events filtered by query parameters', async () => {
      // Mock request with query parameters
      const req = new NextRequest(
        new URL('https://example.com/api/audit?action=access_granted&startDate=2023-01-01'),
        {
          headers: {
            'x-tenant-id': 'tenant-123',
            'authorization': 'Bearer mock-token'
          }
        }
      );
      
      // Mock JWT decode
      jwt.decode.mockReturnValue({ userId: 'user-123' });
      
      // Mock RoleService
      (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
      
      // Mock AuditService
      const mockEvents = [{ id: 'event-1' }, { id: 'event-2' }];
      (AuditService.queryEvents as jest.Mock).mockResolvedValue(mockEvents);
      
      // Call the handler
      const response = await GET(req);
      const data = await response.json();
      
      // Check that withPermission was called with correct parameters
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'audit',
        'read',
        expect.any(Function)
      );
      
      // Check that AuditService.queryEvents was called with correct parameters
      expect(AuditService.queryEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          action: 'access_granted',
          startDate: '2023-01-01'
        }),
        'tenant-123',
        false
      );
      
      // Check response
      expect(response.status).toBe(200);
      expect(data).toEqual({ events: mockEvents });
    });
    
    it('should allow global admins to query all tenants', async () => {
      // Mock request
      const req = new NextRequest(
        new URL('https://example.com/api/audit'),
        {
          headers: {
            'x-tenant-id': 'tenant-123',
            'authorization': 'Bearer mock-token'
          }
        }
      );
      
      // Mock JWT decode
      jwt.decode.mockReturnValue({ userId: 'admin-user' });
      
      // Mock RoleService - user is global admin
      (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(true);
      
      // Mock AuditService
      (AuditService.queryEvents as jest.Mock).mockResolvedValue([]);
      
      // Call the handler
      await GET(req);
      
      // Check that AuditService.queryEvents was called with isGlobalAdmin=true
      expect(AuditService.queryEvents).toHaveBeenCalledWith(
        expect.anything(),
        'tenant-123',
        true
      );
    });
  });
  
  describe('POST /api/audit', () => {
    it('should create a new audit event', async () => {
      // Mock request with body
      const req = new NextRequest(
        new URL('https://example.com/api/audit'),
        {
          headers: {
            'x-tenant-id': 'tenant-123',
            'authorization': 'Bearer mock-token',
            'content-type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({
            action: 'user_created',
            resourceType: 'user',
            resourceId: 'new-user',
            details: { email: 'test@example.com' }
          })
        }
      );
      
      // Mock JWT decode
      jwt.decode.mockReturnValue({ userId: 'admin-user' });
      
      // Mock RoleService
      (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
      
      // Mock AuditService
      const mockEvent = { id: 'new-event' };
      (AuditService.logEvent as jest.Mock).mockResolvedValue(mockEvent);
      
      // Call the handler
      const response = await POST(req);
      const data = await response.json();
      
      // Check that withPermission was called with correct parameters
      expect(withPermission).toHaveBeenCalledWith(
        req,
        'audit',
        'create',
        expect.any(Function)
      );
      
      // Check that AuditService.logEvent was called with correct parameters
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-user',
          tenantId: 'tenant-123',
          action: 'user_created',
          resourceType: 'user',
          resourceId: 'new-user'
        })
      );
      
      // Check response
      expect(response.status).toBe(200);
      expect(data).toEqual({ event: mockEvent });
    });
    
    it('should prevent creating events for other tenants', async () => {
      // Mock request with body for different tenant
      const req = new NextRequest(
        new URL('https://example.com/api/audit'),
        {
          headers: {
            'x-tenant-id': 'tenant-123',
            'authorization': 'Bearer mock-token',
            'content-type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({
            tenantId: 'different-tenant',
            action: 'user_created',
            resourceType: 'user',
            resourceId: 'new-user'
          })
        }
      );
      
      // Mock JWT decode
      jwt.decode.mockReturnValue({ userId: 'user-123' });
      
      // Mock RoleService - not a global admin
      (RoleService.hasGlobalRole as jest.Mock).mockResolvedValue(false);
      
      // Call the handler
      const response = await POST(req);
      
      // Check response is forbidden
      expect(response.status).toBe(403);
    });
  });
});
