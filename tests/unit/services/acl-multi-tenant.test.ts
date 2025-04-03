import { v4 as uuidv4 } from 'uuid';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    smembers: jest.fn().mockResolvedValue([]),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  
  return {
    redis: mockRedis,
  };
});

describe('ACLService - Multi-Tenant', () => {
  const testUserId = 'user_' + uuidv4();
  const tenant1 = 'tenant_1';
  const tenant2 = 'tenant_2';
  
  const mockTenantMemberships = {
    [tenant1]: {
      userId: testUserId,
      tenantId: tenant1,
      roles: ['role_admin_t1', 'role_editor_t1'],
      isActive: true
    },
    [tenant2]: {
      userId: testUserId,
      tenantId: tenant2,
      roles: ['role_viewer_t2'],
      isActive: true
    }
  };
  
  const mockRoles = {
    role_admin_t1: {
      id: 'role_admin_t1',
      name: 'Admin',
      tenantId: tenant1,
      permissions: ['create:category', 'read:category', 'update:category', 'delete:category']
    },
    role_editor_t1: {
      id: 'role_editor_t1',
      name: 'Editor',
      tenantId: tenant1,
      permissions: ['read:category', 'update:category']
    },
    role_viewer_t2: {
      id: 'role_viewer_t2',
      name: 'Viewer',
      tenantId: tenant2,
      permissions: ['read:category']
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  it('should have a hasPermission method', async () => {
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Verify the method exists
    expect(typeof ACLService.hasPermission).toBe('function');
  });
  
  it('should have a getUserTenants method', async () => {
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Verify the method exists
    expect(typeof ACLService.getUserTenants).toBe('function');
  });
  
  it('should have an isTenantMember method', async () => {
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Verify the method exists
    expect(typeof ACLService.isTenantMember).toBe('function');
  });
  
  it('should return true if user has the required permission in the tenant', async () => {
    // Mock Redis to return user membership and roles
    const { redis } = require('@/lib/redis-client');
    redis.get.mockImplementation((key) => {
      if (key === `test:user:${testUserId}:tenant:${tenant1}`) {
        return Promise.resolve(JSON.stringify(mockTenantMemberships[tenant1]));
      } else if (key === 'test:role:role_admin_t1') {
        return Promise.resolve(JSON.stringify(mockRoles.role_admin_t1));
      } else if (key === 'test:role:role_editor_t1') {
        return Promise.resolve(JSON.stringify(mockRoles.role_editor_t1));
      }
      return Promise.resolve(null);
    });
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const hasPermission = await ACLService.hasPermission(testUserId, tenant1, 'create:category');
    
    // Verify Redis was called with the correct keys
    expect(redis.get).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${tenant1}`);
    expect(redis.get).toHaveBeenCalledWith('test:role:role_admin_t1');
    
    // Verify the result
    expect(hasPermission).toBe(true);
  });
  
  it('should return false if user does not have the required permission in the tenant', async () => {
    // Mock Redis to return user membership and roles
    const { redis } = require('@/lib/redis-client');
    redis.get.mockImplementation((key) => {
      if (key === `test:user:${testUserId}:tenant:${tenant2}`) {
        return Promise.resolve(JSON.stringify(mockTenantMemberships[tenant2]));
      } else if (key === 'test:role:role_viewer_t2') {
        return Promise.resolve(JSON.stringify(mockRoles.role_viewer_t2));
      }
      return Promise.resolve(null);
    });
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const hasPermission = await ACLService.hasPermission(testUserId, tenant2, 'create:category');
    
    // Verify Redis was called with the correct keys
    expect(redis.get).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${tenant2}`);
    expect(redis.get).toHaveBeenCalledWith('test:role:role_viewer_t2');
    
    // Verify the result
    expect(hasPermission).toBe(false);
  });
  
  it('should return false if user is not a member of the tenant', async () => {
    // Mock Redis to return null for user membership
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(null);
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const hasPermission = await ACLService.hasPermission(testUserId, 'non_existent_tenant', 'create:category');
    
    // Verify Redis was called with the correct key
    expect(redis.get).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:non_existent_tenant`);
    
    // Verify the result
    expect(hasPermission).toBe(false);
  });
  
  it('should return all tenants that a user is a member of', async () => {
    // Mock Redis to return tenant memberships
    const { redis } = require('@/lib/redis-client');
    redis.keys.mockResolvedValue([
      `test:user:${testUserId}:tenant:${tenant1}`,
      `test:user:${testUserId}:tenant:${tenant2}`
    ]);
    redis.get.mockImplementation((key) => {
      if (key === `test:user:${testUserId}:tenant:${tenant1}`) {
        return Promise.resolve(JSON.stringify(mockTenantMemberships[tenant1]));
      } else if (key === `test:user:${testUserId}:tenant:${tenant2}`) {
        return Promise.resolve(JSON.stringify(mockTenantMemberships[tenant2]));
      }
      return Promise.resolve(null);
    });
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const tenants = await ACLService.getUserTenants(testUserId);
    
    // Verify Redis was called with the correct key
    expect(redis.keys).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:*`);
    
    // Verify the result
    expect(tenants).toEqual([tenant1, tenant2]);
  });
  
  it('should check if a user is a member of a tenant', async () => {
    // Mock Redis to return user membership
    const { redis } = require('@/lib/redis-client');
    redis.get.mockImplementation((key) => {
      if (key === `test:user:${testUserId}:tenant:${tenant1}`) {
        return Promise.resolve(JSON.stringify(mockTenantMemberships[tenant1]));
      }
      return Promise.resolve(null);
    });
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const isMember = await ACLService.isTenantMember(testUserId, tenant1);
    
    // Verify Redis was called with the correct key
    expect(redis.get).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${tenant1}`);
    
    // Verify the result
    expect(isMember).toBe(true);
  });
  
  it('should return false if user membership is not active', async () => {
    // Create an inactive membership
    const inactiveMembership = {
      ...mockTenantMemberships[tenant1],
      isActive: false
    };
    
    // Mock Redis to return inactive user membership
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(JSON.stringify(inactiveMembership));
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const isMember = await ACLService.isTenantMember(testUserId, tenant1);
    
    // Verify Redis was called with the correct key
    expect(redis.get).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${tenant1}`);
    
    // Verify the result
    expect(isMember).toBe(false);
  });
});
