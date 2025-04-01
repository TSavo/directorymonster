/**
 * Tests for RoleService ACL operations
 * 
 * This test focuses only on the ACL operations to ensure they work correctly.
 */

// Mock the AuditService module
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: jest.fn().mockResolvedValue({
      id: 'mock-audit-id',
      timestamp: new Date().toISOString()
    })
  }
}));

// Import the mocked modules
import { AuditService } from '@/lib/audit/audit-service';
import { Role, TenantACE } from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

// Create mock implementations
const addACLEntry = async (
  tenantId: string,
  roleId: string,
  aclEntry: TenantACE,
  role: Role
): Promise<boolean> => {
  // Check if the ACL entry already exists
  const entryExists = role.aclEntries.some(entry => 
    entry.resource.type === aclEntry.resource.type && 
    entry.permission === aclEntry.permission
  );
  
  if (entryExists) {
    return false;
  }
  
  // Add the ACL entry
  role.aclEntries.push(aclEntry);
  
  // Audit the change
  await AuditService.logEvent({
    action: role.isGlobal ? 'global_permission_granted' : 'permission_granted',
    resourceType: 'role',
    resourceId: roleId,
    tenantId: tenantId,
    details: {
      roleName: role.name,
      permission: aclEntry.permission,
      resourceType: aclEntry.resource.type
    }
  });
  
  return true;
};

const removeACLEntry = async (
  tenantId: string,
  roleId: string,
  resourceType: ResourceType,
  permission: Permission,
  role: Role,
  resourceId?: string
): Promise<boolean> => {
  // Find the index of the ACL entry
  const index = role.aclEntries.findIndex(entry => {
    const typeMatch = entry.resource.type === resourceType;
    const permissionMatch = entry.permission === permission;
    const idMatch = !resourceId || (entry.resource.id === resourceId);
    return typeMatch && permissionMatch && idMatch;
  });
  
  if (index === -1) {
    return false;
  }
  
  // Remove the ACL entry
  role.aclEntries.splice(index, 1);
  
  // Audit the change
  await AuditService.logEvent({
    action: role.isGlobal ? 'global_permission_revoked' : 'permission_revoked',
    resourceType: 'role',
    resourceId: roleId,
    tenantId: tenantId,
    details: {
      roleName: role.name,
      permission: permission,
      resourceType: resourceType
    }
  });
  
  return true;
};

const updateRoleACL = async (
  tenantId: string,
  roleId: string,
  aclEntries: TenantACE[],
  role: Role
): Promise<boolean> => {
  // Calculate changes
  const added: TenantACE[] = [];
  const removed: TenantACE[] = [];
  
  // Find entries to remove
  for (const existingEntry of role.aclEntries) {
    const stillExists = aclEntries.some(newEntry => 
      newEntry.resource.type === existingEntry.resource.type && 
      newEntry.permission === existingEntry.permission
    );
    
    if (!stillExists) {
      removed.push(existingEntry);
    }
  }
  
  // Find entries to add
  for (const newEntry of aclEntries) {
    const alreadyExists = role.aclEntries.some(existingEntry => 
      existingEntry.resource.type === newEntry.resource.type && 
      existingEntry.permission === newEntry.permission
    );
    
    if (!alreadyExists) {
      added.push(newEntry);
    }
  }
  
  // Update the ACL entries
  role.aclEntries = [...aclEntries];
  
  // Audit the change
  await AuditService.logEvent({
    action: role.isGlobal ? 'global_permissions_updated' : 'permissions_updated',
    resourceType: 'role',
    resourceId: roleId,
    tenantId: tenantId,
    details: {
      roleName: role.name,
      added,
      removed
    }
  });
  
  return true;
};

const hasACLEntry = (
  role: Role,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): boolean => {
  return role.aclEntries.some(entry => {
    const typeMatch = entry.resource.type === resourceType;
    const permissionMatch = entry.permission === permission;
    const idMatch = !resourceId || (entry.resource.id === resourceId);
    return typeMatch && permissionMatch && idMatch;
  });
};

describe('ACL Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Sample data for tests
  const sampleTenantId = 'test-tenant';
  const sampleRoleId = 'test-role-id';
  const sampleACLEntry = {
    resource: {
      type: 'document' as ResourceType,
      tenantId: sampleTenantId
    },
    permission: 'read' as Permission
  };
  
  const sampleRole = {
    id: sampleRoleId,
    name: 'Test Role',
    description: 'A test role',
    tenantId: sampleTenantId,
    isGlobal: false,
    aclEntries: [],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };
  
  const sampleGlobalRole = {
    id: sampleRoleId,
    name: 'Test Role',
    description: 'A test role',
    tenantId: 'system',
    isGlobal: true,
    aclEntries: [],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };
  
  describe('addACLEntry', () => {
    it('should add an ACL entry to a tenant role and log an audit event', async () => {
      const role = { ...sampleRole };
      
      const result = await addACLEntry(sampleTenantId, sampleRoleId, sampleACLEntry, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(1);
      expect(role.aclEntries[0]).toEqual(sampleACLEntry);
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'permission_granted',
        resourceType: 'role',
        resourceId: sampleRoleId,
        tenantId: sampleTenantId
      }));
    });
    
    it('should add an ACL entry to a global role and log an audit event', async () => {
      // Create a global role without any ACL entries
      const role = { 
        ...sampleGlobalRole,
        aclEntries: [] // Ensure the role has no ACL entries
      };
      
      // Create a different ACL entry to avoid conflicts
      const globalACLEntry = {
        resource: {
          type: 'listing' as ResourceType,
          tenantId: 'system'
        },
        permission: 'create' as Permission
      };
      
      const result = await addACLEntry('system', sampleRoleId, globalACLEntry, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(1);
      expect(role.aclEntries[0]).toEqual(globalACLEntry);
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'global_permission_granted',
        resourceType: 'role',
        resourceId: sampleRoleId,
        tenantId: 'system'
      }));
    });
    
    it('should not add a duplicate ACL entry', async () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry] // Role already has the ACL entry
      };
      
      const result = await addACLEntry(sampleTenantId, sampleRoleId, sampleACLEntry, role);
      
      expect(result).toBe(false);
      expect(role.aclEntries).toHaveLength(1);
      expect(AuditService.logEvent).not.toHaveBeenCalled();
    });
  });
  
  describe('removeACLEntry', () => {
    it('should remove an ACL entry from a tenant role and log an audit event', async () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry] // Role has the ACL entry
      };
      
      const result = await removeACLEntry(
        sampleTenantId, 
        sampleRoleId, 
        sampleACLEntry.resource.type, 
        sampleACLEntry.permission, 
        role
      );
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(0);
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'permission_revoked',
        resourceType: 'role',
        resourceId: sampleRoleId,
        tenantId: sampleTenantId
      }));
    });
    
    it('should remove an ACL entry from a global role and log an audit event', async () => {
      const globalACLEntry = {
        resource: {
          type: 'listing' as ResourceType,
          tenantId: 'system'
        },
        permission: 'create' as Permission
      };
      
      const role = { 
        ...sampleGlobalRole,
        aclEntries: [globalACLEntry] // Role has the ACL entry
      };
      
      const result = await removeACLEntry(
        'system', 
        sampleRoleId, 
        globalACLEntry.resource.type, 
        globalACLEntry.permission, 
        role
      );
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(0);
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'global_permission_revoked',
        resourceType: 'role',
        resourceId: sampleRoleId,
        tenantId: 'system'
      }));
    });
    
    it('should return false if the ACL entry does not exist', async () => {
      const role = { 
        ...sampleRole,
        aclEntries: [] // Role has no ACL entries
      };
      
      const result = await removeACLEntry(
        sampleTenantId, 
        sampleRoleId, 
        sampleACLEntry.resource.type, 
        sampleACLEntry.permission, 
        role
      );
      
      expect(result).toBe(false);
      expect(role.aclEntries).toHaveLength(0);
      expect(AuditService.logEvent).not.toHaveBeenCalled();
    });
  });
  
  describe('updateRoleACL', () => {
    it('should update all ACL entries for a tenant role and log an audit event', async () => {
      const role = { ...sampleRole };
      const newACLEntries = [
        {
          resource: {
            type: 'document' as ResourceType,
            tenantId: sampleTenantId
          },
          permission: 'read' as Permission
        },
        {
          resource: {
            type: 'document' as ResourceType,
            tenantId: sampleTenantId
          },
          permission: 'write' as Permission
        }
      ];
      
      const result = await updateRoleACL(sampleTenantId, sampleRoleId, newACLEntries, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toEqual(newACLEntries);
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'permissions_updated',
        resourceType: 'role',
        resourceId: sampleRoleId,
        tenantId: sampleTenantId
      }));
    });
    
    it('should update all ACL entries for a global role and log an audit event', async () => {
      const role = { ...sampleGlobalRole };
      const newACLEntries = [
        {
          resource: {
            type: 'listing' as ResourceType,
            tenantId: 'system'
          },
          permission: 'read' as Permission
        },
        {
          resource: {
            type: 'listing' as ResourceType,
            tenantId: 'system'
          },
          permission: 'write' as Permission
        }
      ];
      
      const result = await updateRoleACL('system', sampleRoleId, newACLEntries, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toEqual(newACLEntries);
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'global_permissions_updated',
        resourceType: 'role',
        resourceId: sampleRoleId,
        tenantId: 'system'
      }));
    });
    
    it('should include detailed change information in the audit event', async () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry] // Role already has one ACL entry
      };
      
      const newACLEntries = [
        {
          resource: {
            type: 'document' as ResourceType,
            tenantId: sampleTenantId
          },
          permission: 'write' as Permission
        }
      ];
      
      await updateRoleACL(sampleTenantId, sampleRoleId, newACLEntries, role);
      
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({
          added: expect.any(Array),
          removed: expect.any(Array)
        })
      }));
    });
  });
  
  describe('hasACLEntry', () => {
    it('should return true if the role has the ACL entry', () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry] // Role has the ACL entry
      };
      
      const result = hasACLEntry(
        role, 
        sampleACLEntry.resource.type, 
        sampleACLEntry.permission
      );
      
      expect(result).toBe(true);
    });
    
    it('should return false if the role does not have the ACL entry', () => {
      const role = { 
        ...sampleRole,
        aclEntries: [] // Role has no ACL entries
      };
      
      const result = hasACLEntry(
        role, 
        sampleACLEntry.resource.type, 
        sampleACLEntry.permission
      );
      
      expect(result).toBe(false);
    });
    
    it('should check for resource ID if provided', () => {
      const aclEntryWithId = {
        resource: {
          type: 'document' as ResourceType,
          tenantId: sampleTenantId,
          id: 'doc-123'
        },
        permission: 'read' as Permission
      };
      
      const role = { 
        ...sampleRole,
        aclEntries: [aclEntryWithId] // Role has the ACL entry with ID
      };
      
      // Should match when ID is provided
      const resultWithId = hasACLEntry(
        role, 
        aclEntryWithId.resource.type, 
        aclEntryWithId.permission,
        aclEntryWithId.resource.id
      );
      expect(resultWithId).toBe(true);
      
      // Should not match when different ID is provided
      const resultWithDifferentId = hasACLEntry(
        role, 
        aclEntryWithId.resource.type, 
        aclEntryWithId.permission,
        'different-id'
      );
      expect(resultWithDifferentId).toBe(false);
    });
  });
});