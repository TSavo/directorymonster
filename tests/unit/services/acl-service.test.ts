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

describe('ACLService', () => {
  const testUserId = 'user_' + uuidv4();
  const testTenantId = 'tenant_' + uuidv4();
  
  const mockUserRoles = [
    {
      id: 'role_1',
      name: 'Admin',
      permissions: ['create:category', 'read:category', 'update:category', 'delete:category']
    },
    {
      id: 'role_2',
      name: 'Editor',
      permissions: ['read:category', 'update:category']
    },
    {
      id: 'role_3',
      name: 'Viewer',
      permissions: ['read:category']
    }
  ];
  
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
  
  it('should return true if user has the required permission', async () => {
    // Mock Redis to return user roles
    const { redis } = require('@/lib/redis-client');
    redis.smembers.mockResolvedValue(['role_1', 'role_2']); // User has Admin and Editor roles
    redis.get.mockImplementation((key) => {
      if (key === 'test:role:role_1') {
        return Promise.resolve(JSON.stringify(mockUserRoles[0]));
      } else if (key === 'test:role:role_2') {
        return Promise.resolve(JSON.stringify(mockUserRoles[1]));
      }
      return Promise.resolve(null);
    });
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const hasPermission = await ACLService.hasPermission(testUserId, testTenantId, 'create:category');
    
    // Verify Redis was called with the correct keys
    expect(redis.smembers).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${testTenantId}:roles`);
    expect(redis.get).toHaveBeenCalledWith('test:role:role_1');
    expect(redis.get).toHaveBeenCalledWith('test:role:role_2');
    
    // Verify the result
    expect(hasPermission).toBe(true);
  });
  
  it('should return false if user does not have the required permission', async () => {
    // Mock Redis to return user roles
    const { redis } = require('@/lib/redis-client');
    redis.smembers.mockResolvedValue(['role_3']); // User has only Viewer role
    redis.get.mockImplementation((key) => {
      if (key === 'test:role:role_3') {
        return Promise.resolve(JSON.stringify(mockUserRoles[2]));
      }
      return Promise.resolve(null);
    });
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const hasPermission = await ACLService.hasPermission(testUserId, testTenantId, 'create:category');
    
    // Verify Redis was called with the correct keys
    expect(redis.smembers).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${testTenantId}:roles`);
    expect(redis.get).toHaveBeenCalledWith('test:role:role_3');
    
    // Verify the result
    expect(hasPermission).toBe(false);
  });
  
  it('should return false if user has no roles', async () => {
    // Mock Redis to return empty array for user roles
    const { redis } = require('@/lib/redis-client');
    redis.smembers.mockResolvedValue([]);
    
    // Import the service
    const { ACLService } = require('@/services/acl-service');
    
    // Call the method
    const hasPermission = await ACLService.hasPermission(testUserId, testTenantId, 'create:category');
    
    // Verify Redis was called with the correct key
    expect(redis.smembers).toHaveBeenCalledWith(`test:user:${testUserId}:tenant:${testTenantId}:roles`);
    
    // Verify the result
    expect(hasPermission).toBe(false);
  });
});
