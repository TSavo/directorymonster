import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/tenants/[id]/sites/route';
import { SiteService } from '../../../src/lib/site-service';
import { withSecureTenantPermission } from '../../../src/app/api/middleware/secureTenantContext';

// Mock dependencies
jest.mock('../../../src/lib/site-service');
jest.mock('../../../src/app/api/middleware/secureTenantContext');

describe('GET /api/tenants/[id]/sites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sites for the tenant', async () => {
    // Mock withSecureTenantPermission to call the handler with matching tenant context
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        return handler(req, { tenantId: 'tenant-1', userId: 'user-1' });
      }
    );

    // Mock getSitesByTenant to return sites
    const mockSites = [
      { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
      { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
    ];
    (SiteService.getSitesByTenant as jest.Mock).mockResolvedValue(mockSites);

    // Create mock request and params
    const req = new NextRequest('http://localhost/api/tenants/tenant-1/sites');
    const params = { params: { id: 'tenant-1' } };

    // Call the handler
    const response = await GET(req, params as any);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual(mockSites);
    expect(SiteService.getSitesByTenant).toHaveBeenCalledWith('tenant-1');
  });

  it('should return 403 if tenant ID does not match context tenant ID', async () => {
    // Mock withSecureTenantPermission to call the handler with non-matching tenant context
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        return handler(req, { tenantId: 'tenant-1', userId: 'user-1' });
      }
    );

    // Create mock request and params for a different tenant
    const req = new NextRequest('http://localhost/api/tenants/tenant-2/sites');
    const params = { params: { id: 'tenant-2' } };

    // Call the handler
    const response = await GET(req, params as any);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(403);
    expect(data).toEqual({ error: 'Access denied to requested tenant' });
    expect(SiteService.getSitesByTenant).not.toHaveBeenCalled();
  });

  it('should handle errors and return 500', async () => {
    // Mock withSecureTenantPermission to call the handler with matching tenant context
    (withSecureTenantPermission as jest.Mock).mockImplementation(
      (req, resourceType, permission, handler) => {
        return handler(req, { tenantId: 'tenant-1', userId: 'user-1' });
      }
    );

    // Mock getSitesByTenant to throw an error
    (SiteService.getSitesByTenant as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    // Create mock request and params
    const req = new NextRequest('http://localhost/api/tenants/tenant-1/sites');
    const params = { params: { id: 'tenant-1' } };

    // Call the handler
    const response = await GET(req, params as any);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal Server Error' });
  });
});
