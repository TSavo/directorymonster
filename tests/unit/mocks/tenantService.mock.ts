/**
 * Mock for TenantService
 */

// Create mock functions
export const mockGetAllTenants = jest.fn().mockResolvedValue([
  { id: 'tenant-1', name: 'Test Tenant 1' },
  { id: 'tenant-2', name: 'Test Tenant 2' }
]);

export const mockGetTenantById = jest.fn().mockImplementation((id: string) => {
  return Promise.resolve({ id, name: `Test Tenant ${id}` });
});

export const mockCreateTenant = jest.fn().mockImplementation((data: any) => {
  return Promise.resolve({
    id: 'new-tenant-id',
    ...data,
    createdAt: new Date().toISOString()
  });
});

export const mockUpdateTenant = jest.fn().mockResolvedValue(true);
export const mockDeleteTenant = jest.fn().mockResolvedValue(true);

// Create the mock TenantService object
const mockTenantService = {
  getAllTenants: mockGetAllTenants,
  getTenantById: mockGetTenantById,
  createTenant: mockCreateTenant,
  updateTenant: mockUpdateTenant,
  deleteTenant: mockDeleteTenant
};

export default mockTenantService;
