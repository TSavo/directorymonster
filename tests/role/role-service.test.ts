/**
 * @jest-environment node
 */
import { RoleService } from '@/lib/role/role-service';
import { Role, ACE, ResourceType, Permission } from '@/lib/role/types';

// Mock the Redis client
jest.mock('../../src/lib/redis-client', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    mget: jest.fn(),
    keys: jest.fn(),
  },
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

describe('RoleService', () => {
  const { redis } = require('../../src/lib/redis-client');
  
  // Mock data
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';
  const mockRoleId = 'role-789';
  const mockRoleName = 'Editor';
  
  const mockRole: Role = {
    id: mockRoleId,
    name: mockRoleName,
    description: 'Can edit content',
    tenantId: mockTenantId,
    isGlobal: false,
    aclEntries: [
      {
        resource: {
          type: 'listing' as ResourceType,
          tenantId: mockTenantId
        },
        permission: 'update' as Permission
      },
      {
        resource: {
          type: 'category' as ResourceType,
          tenantId: mockTenantId
        },
        permission: 'read' as Permission
      }
    ],
    createdAt: '2025-03-30T00:00:00Z',
    updatedAt: '2025-03-30T00:00:00Z'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createRole', () => {
    it('should create a new role in Redis', async () => {
      // Setup
      const roleWithoutId = {
        name: mockRoleName,
        description: 'Can edit content',
        tenantId: mockTenantId,
        isGlobal: false,
        aclEntries: mockRole.aclEntries
      };
      
      // Mock implementations
      (redis.set as jest.Mock).mockResolvedValue('OK');
      
      // Execute
      const result = await RoleService.createRole(roleWithoutId);
      
      // Verify
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(mockRoleName);
      expect(result.tenantId).toBe(mockTenantId);
      expect(result.aclEntries).toEqual(mockRole.aclEntries);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      
      // Verify Redis set was called
      expect(redis.set).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining(`role:${mockTenantId}:`),
        expect.any(String)
      );
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining(`role:${mockTenantId}:name:${mockRoleName}`),
        expect.any(String)
      );
    });
  });
  
  describe('updateRole', () => {
    it('should update an existing role', async () => {
      // Setup
      const updates = {
        name: 'Senior Editor',
        description: 'Can edit and approve content'
      };
      
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      (redis.set as jest.Mock).mockResolvedValue('OK');
      (redis.del as jest.Mock).mockResolvedValue(1);
      
      // Execute
      const result = await RoleService.updateRole(mockTenantId, mockRoleId, updates);
      
      // Verify
      expect(result.name).toBe(updates.name);
      expect(result.description).toBe(updates.description);
      expect(result.id).toBe(mockRoleId);
      expect(result.tenantId).toBe(mockTenantId);
      
      // Verify Redis operations were called
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
      expect(redis.del).toHaveBeenCalledWith(`role:${mockTenantId}:name:${mockRoleName}`);
      expect(redis.set).toHaveBeenCalledWith(
        `role:${mockTenantId}:name:${updates.name}`,
        mockRoleId
      );
      expect(redis.set).toHaveBeenCalledWith(
        `role:${mockTenantId}:${mockRoleId}`,
        expect.any(String)
      );
    });
    
    it('should throw an error when role not found', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      // Execute and verify
      await expect(
        RoleService.updateRole(mockTenantId, 'non-existent-role', { name: 'New Name' })
      ).rejects.toThrow('Role with ID non-existent-role not found in tenant tenant-123');
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role and remove all assignments', async () => {
      // Setup
      const userIds = ['user1', 'user2'];
      
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.smembers as jest.Mock).mockResolvedValue(userIds);
      (redis.srem as jest.Mock).mockResolvedValue(1);
      
      // Execute
      const result = await RoleService.deleteRole(mockTenantId, mockRoleId);
      
      // Verify
      expect(result).toBe(true);
      
      // Verify Redis operations
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
      expect(redis.del).toHaveBeenCalledWith(`role:${mockTenantId}:name:${mockRoleName}`);
      expect(redis.del).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
      expect(redis.smembers).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}:users`);
      expect(redis.srem).toHaveBeenCalledTimes(userIds.length * 2); // For each user, remove from two sets
      expect(redis.del).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}:users`);
    });
    
    it('should return false when role not found', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await RoleService.deleteRole(mockTenantId, 'non-existent-role');
      
      // Verify
      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith(`role:tenant-123:non-existent-role`);
      expect(redis.del).not.toHaveBeenCalled();
    });
  });
  
  describe('getRoleById', () => {
    it('should return a role by ID', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      
      // Execute
      const result = await RoleService.getRoleById(mockTenantId, mockRoleId);
      
      // Verify
      expect(result).toEqual(mockRole);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
    
    it('should return null when role not found', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await RoleService.getRoleById(mockTenantId, 'non-existent-role');
      
      // Verify
      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledWith(`role:tenant-123:non-existent-role`);
    });
  });
  
  describe('getRoleByName', () => {
    it('should return a role by name', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === `role:${mockTenantId}:name:${mockRoleName}`) {
          return Promise.resolve(mockRoleId);
        }
        if (key === `role:${mockTenantId}:${mockRoleId}`) {
          return Promise.resolve(JSON.stringify(mockRole));
        }
        return Promise.resolve(null);
      });
      
      // Execute
      const result = await RoleService.getRoleByName(mockTenantId, mockRoleName);
      
      // Verify
      expect(result).toEqual(mockRole);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:name:${mockRoleName}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
    
    it('should return null when role name not found', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await RoleService.getRoleByName(mockTenantId, 'non-existent-role');
      
      // Verify
      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledWith(`role:tenant-123:name:non-existent-role`);
    });
  });
  
  describe('getRolesByTenant', () => {
    it('should return all roles in a tenant', async () => {
      // Setup
      const mockRoles = [mockRole, { ...mockRole, id: 'role-abc', name: 'Admin' }];
      const mockKeys = [
        `role:${mockTenantId}:${mockRoleId}`,
        `role:${mockTenantId}:role-abc`,
        `role:${mockTenantId}:name:${mockRoleName}`,
        `role:${mockTenantId}:name:Admin`
      ];
      
      // Mock implementations
      (redis.keys as jest.Mock).mockResolvedValue(mockKeys);
      (redis.mget as jest.Mock).mockResolvedValue([
        JSON.stringify(mockRoles[0]),
        JSON.stringify(mockRoles[1])
      ]);
      
      // Execute
      const result = await RoleService.getRolesByTenant(mockTenantId);
      
      // Verify
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockRoles));
      expect(redis.keys).toHaveBeenCalledWith(`role:${mockTenantId}:*`);
      expect(redis.mget).toHaveBeenCalledWith(
        `role:${mockTenantId}:${mockRoleId}`,
        `role:${mockTenantId}:role-abc`
      );
    });
    
    it('should return empty array when no roles found', async () => {
      // Mock implementations
      (redis.keys as jest.Mock).mockResolvedValue([]);
      
      // Execute
      const result = await RoleService.getRolesByTenant(mockTenantId);
      
      // Verify
      expect(result).toEqual([]);
      expect(redis.keys).toHaveBeenCalledWith(`role:${mockTenantId}:*`);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      (redis.sadd as jest.Mock).mockResolvedValue(1);
      (redis.set as jest.Mock).mockResolvedValue('OK');
      
      // Execute
      await RoleService.assignRoleToUser(mockUserId, mockTenantId, mockRoleId);
      
      // Verify Redis operations
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
      expect(redis.sadd).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`, mockRoleId);
      expect(redis.sadd).toHaveBeenCalledWith(`tenant:users:${mockTenantId}`, mockUserId);
      expect(redis.sadd).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}:users`, mockUserId);
      expect(redis.set).toHaveBeenCalledWith(
        `user:role:${mockUserId}:${mockTenantId}:${mockRoleId}`,
        expect.any(String)
      );
    });
    
    it('should throw error when role not found', async () => {
      // Mock implementations
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      // Execute and verify
      await expect(
        RoleService.assignRoleToUser(mockUserId, mockTenantId, 'non-existent-role')
      ).rejects.toThrow('Role with ID non-existent-role not found in tenant tenant-123');
      
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:non-existent-role`);
      expect(redis.sadd).not.toHaveBeenCalled();
    });
  });
  
  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      // Mock implementations
      (redis.srem as jest.Mock).mockResolvedValue(1);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.smembers as jest.Mock).mockResolvedValue(['another-role-id']);
      
      // Execute
      await RoleService.removeRoleFromUser(mockUserId, mockTenantId, mockRoleId);
      
      // Verify Redis operations
      expect(redis.srem).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`, mockRoleId);
      expect(redis.srem).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}:users`, mockUserId);
      expect(redis.del).toHaveBeenCalledWith(`user:role:${mockUserId}:${mockTenantId}:${mockRoleId}`);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      // Should not remove from tenant:users because user still has another role
      expect(redis.srem).not.toHaveBeenCalledWith(`tenant:users:${mockTenantId}`, mockUserId);
    });
    
    it('should remove user from tenant when no roles remain', async () => {
      // Mock implementations
      (redis.srem as jest.Mock).mockResolvedValue(1);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.smembers as jest.Mock).mockResolvedValue([]);
      
      // Execute
      await RoleService.removeRoleFromUser(mockUserId, mockTenantId, mockRoleId);
      
      // Verify Redis operations
      expect(redis.srem).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`, mockRoleId);
      expect(redis.srem).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}:users`, mockUserId);
      expect(redis.del).toHaveBeenCalledWith(`user:role:${mockUserId}:${mockTenantId}:${mockRoleId}`);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      // Should remove from tenant:users because user has no roles left
      expect(redis.srem).toHaveBeenCalledWith(`tenant:users:${mockTenantId}`, mockUserId);
    });
  });
  
  describe('getUserRoles', () => {
    it('should return all roles assigned to a user in a tenant', async () => {
      // Setup
      const mockRoles = [mockRole, { ...mockRole, id: 'role-abc', name: 'Admin' }];
      const roleIds = [mockRoleId, 'role-abc'];
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue(roleIds);
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === `role:${mockTenantId}:${mockRoleId}`) {
          return Promise.resolve(JSON.stringify(mockRoles[0]));
        }
        if (key === `role:${mockTenantId}:role-abc`) {
          return Promise.resolve(JSON.stringify(mockRoles[1]));
        }
        return Promise.resolve(null);
      });
      
      // Execute
      const result = await RoleService.getUserRoles(mockUserId, mockTenantId);
      
      // Verify
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockRoles));
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:role-abc`);
    });
    
    it('should return empty array when user has no roles', async () => {
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue([]);
      
      // Execute
      const result = await RoleService.getUserRoles(mockUserId, mockTenantId);
      
      // Verify
      expect(result).toEqual([]);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserTenants', () => {
    it('should return all tenants a user belongs to', async () => {
      // Setup
      const tenantIds = [mockTenantId, 'tenant-456'];
      const userRoleKeys = [
        `user:roles:${mockUserId}:${tenantIds[0]}`,
        `user:roles:${mockUserId}:${tenantIds[1]}`
      ];
      
      // Mock implementations
      (redis.keys as jest.Mock).mockResolvedValue(userRoleKeys);
      
      // Execute
      const result = await RoleService.getUserTenants(mockUserId);
      
      // Verify
      expect(result).toEqual(tenantIds);
      expect(redis.keys).toHaveBeenCalledWith(`user:roles:${mockUserId}:*`);
    });
  });
  
  describe('getUsersWithRole', () => {
    it('should return all users with a specific role', async () => {
      // Setup
      const userIds = [mockUserId, 'user-789'];
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue(userIds);
      
      // Execute
      const result = await RoleService.getUsersWithRole(mockTenantId, mockRoleId);
      
      // Verify
      expect(result).toEqual(userIds);
      expect(redis.smembers).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}:users`);
    });
  });
  
  describe('getTenantUsers', () => {
    it('should return all users in a tenant', async () => {
      // Setup
      const userIds = [mockUserId, 'user-789'];
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue(userIds);
      
      // Execute
      const result = await RoleService.getTenantUsers(mockTenantId);
      
      // Verify
      expect(result).toEqual(userIds);
      expect(redis.smembers).toHaveBeenCalledWith(`tenant:users:${mockTenantId}`);
    });
  });
  
  describe('hasPermission', () => {
    it('should return true when user has required permission', async () => {
      // Setup
      const resourceType: ResourceType = 'listing';
      const permission: Permission = 'update';
      
      // Mock implementations to simulate a role with the required permission
      (redis.smembers as jest.Mock).mockResolvedValue([mockRoleId]);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      
      // Execute
      const result = await RoleService.hasPermission(
        mockUserId,
        mockTenantId,
        resourceType,
        permission
      );
      
      // Verify
      expect(result).toBe(true);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
    
    it('should return false when user does not have required permission', async () => {
      // Setup
      const resourceType: ResourceType = 'listing';
      const permission: Permission = 'delete';
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue([mockRoleId]);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      
      // Execute
      const result = await RoleService.hasPermission(
        mockUserId,
        mockTenantId,
        resourceType,
        permission
      );
      
      // Verify
      expect(result).toBe(false);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
    
    it('should return false when user has no roles', async () => {
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue([]);
      
      // Execute
      const result = await RoleService.hasPermission(
        mockUserId,
        mockTenantId,
        'listing',
        'update'
      );
      
      // Verify
      expect(result).toBe(false);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).not.toHaveBeenCalled(); // Should not fetch roles if user has none
    });
  });
  
  describe('getAccessibleResources', () => {
    it('should return specific resource IDs when user has resource-specific permissions', async () => {
      // Setup
      const resourceType: ResourceType = 'listing';
      const permission: Permission = 'update';
      const roleWithSpecificResources = {
        ...mockRole,
        aclEntries: [
          {
            resource: {
              type: 'listing',
              id: 'listing-123',
              tenantId: mockTenantId
            },
            permission: 'update'
          },
          {
            resource: {
              type: 'listing',
              id: 'listing-456',
              tenantId: mockTenantId
            },
            permission: 'update'
          }
        ]
      };
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue([mockRoleId]);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(roleWithSpecificResources));
      
      // Execute
      const result = await RoleService.getAccessibleResources(
        mockUserId,
        mockTenantId,
        resourceType,
        permission
      );
      
      // Verify
      expect(result).toEqual(['listing-123', 'listing-456']);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
    
    it('should return ["*"] when user has global permission for resource type', async () => {
      // Setup
      const resourceType: ResourceType = 'listing';
      const permission: Permission = 'update';
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue([mockRoleId]);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole)); // mockRole has global listing update
      
      // Execute
      const result = await RoleService.getAccessibleResources(
        mockUserId,
        mockTenantId,
        resourceType,
        permission
      );
      
      // Verify - should indicate global access with "*"
      expect(result).toEqual(['*']);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
    
    it('should return empty array when user has no relevant permissions', async () => {
      // Setup
      const resourceType: ResourceType = 'user';
      const permission: Permission = 'manage';
      
      // Mock implementations
      (redis.smembers as jest.Mock).mockResolvedValue([mockRoleId]);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockRole));
      
      // Execute
      const result = await RoleService.getAccessibleResources(
        mockUserId,
        mockTenantId,
        resourceType,
        permission
      );
      
      // Verify
      expect(result).toEqual([]);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${mockUserId}:${mockTenantId}`);
      expect(redis.get).toHaveBeenCalledWith(`role:${mockTenantId}:${mockRoleId}`);
    });
  });
});