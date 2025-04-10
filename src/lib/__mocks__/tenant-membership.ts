/**
 * Manual mock for TenantMembershipService
 */

export const TenantMembershipService = {
  isTenantMember: jest.fn().mockResolvedValue(true),
  addUserToTenant: jest.fn().mockResolvedValue(true),
  removeUserFromTenant: jest.fn().mockResolvedValue(true),
  getUserTenants: jest.fn().mockResolvedValue([
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Tenant' }
  ])
};

export default TenantMembershipService;
