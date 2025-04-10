import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/tenants/user/route';
import { getUserFromSession } from '../../../src/lib/auth';
import { TenantMembershipService } from '../../../src/lib/tenant-membership-service';
import { withSecureTenantPermission } from '../../../src/app/api/middleware/secureTenantContext';

// Mock dependencies
jest.mock('../../../src/lib/auth', () => ({
  getUserFromSession: jest.fn()
}));
jest.mock('../../../src/lib/tenant-membership-service');
jest.mock('../../../src/app/api/middleware/secureTenantContext');

describe('GET /api/tenants/user', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock withSecureTenantPermission to call the handler with mock context
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        return handler(req, { tenantId: 'tenant-1', userId: 'user-1' });
      }
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock getUserFromSession to return null (not authenticated)
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    // Create mock request
    const req = new NextRequest('http://localhost/api/tenants/user');

    // Call the handler
    const response = await GET(req);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Authentication required' });
  });

  it('should return tenants for the authenticated user', async () => {
    // Mock getUserFromSession to return a user
    (getUserFromSession as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com'
    });

    // Mock getUserTenants to return tenants
    const mockTenants = [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' }
    ];
    (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue(mockTenants);

    // Create mock request
    const req = new NextRequest('http://localhost/api/tenants/user');

    // Call the handler
    const response = await GET(req);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual(mockTenants);
    expect(TenantMembershipService.getUserTenants).toHaveBeenCalledWith('user-1');
  });

  it('should handle errors and return 500', async () => {
    // Mock getUserFromSession to return a user
    (getUserFromSession as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com'
    });

    // Mock getUserTenants to throw an error
    (TenantMembershipService.getUserTenants as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    // Create mock request
    const req = new NextRequest('http://localhost/api/tenants/user');

    // Call the handler
    const response = await GET(req);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal Server Error' });
  });
});
