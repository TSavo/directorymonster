import { NextRequest } from 'next/server';
import { GET } from '../route';
import AuditService from '@/lib/audit/audit-service';
import { withPermission } from '../../../middleware/withPermission';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/audit/audit-service', () => ({
  getRecentEvents: jest.fn()
}));
jest.mock('../../../middleware/withPermission');
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
  verify: jest.fn() // Add verify mock since we now use it
}));

describe('Recent Audit API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock withPermission to call the handler with a validated request
    (withPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => handler(req)
    );
    
    // Mock verify to return the same as decode for test compatibility
    jwt.verify = jwt.decode;
  });
  
  it('should return recent audit events for tenant', async () => {
    // Mock request
    const req = new NextRequest(
      new URL('https://example.com/api/audit/recent?limit=5'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ userId: 'user-123' });
    
    // Mock AuditService
    const mockEvents = [{ id: 'event-1' }, { id: 'event-2' }];
    (AuditService.getRecentEvents as jest.Mock).mockResolvedValue(mockEvents);
    
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
    
    // Check that AuditService.getRecentEvents was called with correct parameters
    expect(AuditService.getRecentEvents).toHaveBeenCalledWith(
      'tenant-123',
      5,
      0
    );
    
    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({ events: mockEvents });
  });
  
  it('should use default pagination if not specified', async () => {
    // Mock request without pagination parameters
    const req = new NextRequest(
      new URL('https://example.com/api/audit/recent'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ userId: 'user-123' });
    
    // Mock AuditService
    (AuditService.getRecentEvents as jest.Mock).mockResolvedValue([]);
    
    // Call the handler
    await GET(req);
    
    // Check that AuditService.getRecentEvents was called with default parameters
    // Updated to match our new default of 50 instead of 20
    expect(AuditService.getRecentEvents).toHaveBeenCalledWith(
      'tenant-123',
      50, // Updated default limit
      0   // default offset
    );
  });
  
  it('should handle errors gracefully', async () => {
    // Mock request
    const req = new NextRequest(
      new URL('https://example.com/api/audit/recent'),
      {
        headers: {
          'x-tenant-id': 'tenant-123',
          'authorization': 'Bearer mock-token'
        }
      }
    );
    
    // Mock JWT decode/verify
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ userId: 'user-123' });
    
    // Mock AuditService to throw error
    (AuditService.getRecentEvents as jest.Mock).mockRejectedValue(new Error('Test error'));
    
    // Call the handler
    const response = await GET(req);
    
    // Check response is error
    expect(response.status).toBe(500);
  });
});
