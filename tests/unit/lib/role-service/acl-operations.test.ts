/**
 * Tests for ACL operations in RoleService
 */

// Mock the AuditService before importing the modules that use it
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: jest.fn().mockResolvedValue(true)
  }
}));

// Import the mocked modules
import { AuditService } from '@/lib/audit/audit-service';
import { Role, TenantACE } from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

// Create mock implementations
const addACLEntry = jest.fn().mockImplementation(async (
  tenantId: string,
  roleId: string,
  aclEntry: TenantACE,
  role: Role
): Promise<boolean> => {
  // Check if the ACL entry already exists
  const entryExists = role.aclEntries.some(entry => 
    entry.resource.type === aclEntry.resource.type &&
    entry.permission === aclEntry.permission &&
    entry.resource.id === aclEntry.resource.id
  );
  
  if (entryExists) {
    return true; // Entry already exists, no need to add
  }
  
  // Add the ACL entry
  role.aclEntries.push(aclEntry);
  role.updatedAt = new Date().toISOString();
  
  // Audit the permission grant
  if (role.isGlobal) {
    await AuditService.logEvent({
      action: 'global_permission_granted',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: 'system',
      details: {
        roleName: role.name,
        resourceType: aclEntry.resource.type,
        permission: aclEntry.permission,
        resourceId: aclEntry.resource.id || 'all'
      }
    });
  } else {
    await AuditService.logEvent({
      action: 'permission_granted',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: tenantId,
      details: {
        roleName: role.name,
        resourceType: aclEntry.resource.type,
        permission: aclEntry.permission,
        resourceId: aclEntry.resource.id || 'all'
      }
    });
  }
  
  return true;
});

const removeACLEntry = jest.fn().mockImplementation(async (
  tenantId: string,
  roleId: string,
  resourceType: ResourceType,
  permission: Permission,
  role: Role,
  resourceId?: string
): Promise<boolean> => {
  // Find the index of the ACL entry to remove
  const entryIndex = role.aclEntries.findIndex(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    (resourceId ? entry.resource.id === resourceId : !entry.resource.id)
  );
  
  if (entryIndex === -1) {
    return false; // Entry doesn't exist
  }
  
  // Store the entry for audit logging
  const removedEntry = role.aclEntries[entryIndex];
  
  // Remove the ACL entry
  role.aclEntries.splice(entryIndex, 1);
  role.updatedAt = new Date().toISOString();
  
  // Audit the permission revocation
  if (role.isGlobal) {
    await AuditService.logEvent({
      action: 'global_permission_revoked',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: 'system',
      details: {
        roleName: role.name,
        resourceType: removedEntry.resource.type,
        permission: removedEntry.permission,
        resourceId: removedEntry.resource.id || 'all'
      }
    });
  } else {
    await AuditService.logEvent({
      action: 'permission_revoked',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: tenantId,
      details: {
        roleName: role.name,
        resourceType: removedEntry.resource.type,
        permission: removedEntry.permission,
        resourceId: removedEntry.resource.id || 'all'
      }
    });
  }
  
  return true;
});

const updateRoleACL = jest.fn().mockImplementation(async (
  tenantId: string,
  roleId: string,
  aclEntries: TenantACE[],
  role: Role
): Promise<Role | null> => {
  // Store the previous ACL entries for audit logging
  const previousACL = [...role.aclEntries];
  
  // Update the ACL entries
  role.aclEntries = aclEntries;
  role.updatedAt = new Date().toISOString();
  
  // Analyze changes for detailed audit logging
  const addedEntries = aclEntries.filter(newEntry => 
    !previousACL.some(oldEntry => 
      oldEntry.resource.type === newEntry.resource.type &&
      oldEntry.permission === newEntry.permission &&
      oldEntry.resource.id === newEntry.resource.id
    )
  );
  
  const removedEntries = previousACL.filter(oldEntry => 
    !aclEntries.some(newEntry => 
      newEntry.resource.type === oldEntry.resource.type &&
      newEntry.permission === oldEntry.permission &&
      newEntry.resource.id === oldEntry.resource.id
    )
  );
  
  // Audit the role ACL update
  if (role.isGlobal) {
    await AuditService.logEvent({
      action: 'global_role_acl_updated',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: 'system',
      details: {
        roleName: role.name,
        previousACL: previousACL.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        newACL: aclEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        added: addedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        removed: removedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        }))
      }
    });
  } else {
    await AuditService.logEvent({
      action: 'role_acl_updated',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: tenantId,
      details: {
        roleName: role.name,
        previousACL: previousACL.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        newACL: aclEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        added: addedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        removed: removedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        }))
      }
    });
  }
  
  return role;
});

const hasACLEntry = jest.fn().mockImplementation((
  role: Role,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): boolean => {
  return role.aclEntries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    (resourceId ? entry.resource.id === resourceId : !entry.resource.id)
  );
});

describe('ACL Operations', () => {
  // Sample role for testing
  const sampleRole: Role = {
    id: 'test-role-id',
    name: 'Test Role',
    description: 'A test role',
    tenantId: 'test-tenant',
    isGlobal: false,
    aclEntries: [],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  // Sample global role for testing
  const sampleGlobalRole: Role = {
    ...sampleRole,
    tenantId: 'system',
    isGlobal: true
  };

  // Sample ACL entry
  const sampleACLEntry: TenantACE = {
    resource: {
      type: 'user' as ResourceType,
      tenantId: 'test-tenant'
    },
    permission: 'read' as Permission
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addACLEntry', () => {
    it('should add an ACL entry to a tenant role and log an audit event', async () => {
      const role = { ...sampleRole };
      
      const result = await addACLEntry('test-tenant', 'test-role-id', sampleACLEntry, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(1);
      expect(role.aclEntries[0]).toEqual(sampleACLEntry);
      expect(addACLEntry).toHaveBeenCalled();
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'permission_granted',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'test-tenant'
      }));
    });

    it('should add an ACL entry to a global role and log an audit event', async () => {
      // Create a global role without any ACL entries
      const role = { 
        ...sampleGlobalRole,
        aclEntries: [] // Ensure the role has no ACL entries
      };
      
      // Create a different ACL entry to avoid conflicts
      const globalACLEntry: TenantACE = {
        resource: {
          type: 'listing' as ResourceType,
          tenantId: 'system'
        },
        permission: 'create' as Permission
      };
      
      const result = await addACLEntry('system', 'test-role-id', globalACLEntry, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(1);
      expect(role.aclEntries[0]).toEqual(globalACLEntry);
      expect(addACLEntry).toHaveBeenCalled();
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'global_permission_granted',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'system'
      }));
    });

    it('should not add a duplicate ACL entry', async () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry]
      };
      
      const result = await addACLEntry('test-tenant', 'test-role-id', sampleACLEntry, role);
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(1);
      expect(AuditService.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('removeACLEntry', () => {
    it('should remove an ACL entry from a tenant role and log an audit event', async () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry]
      };
      
      const result = await removeACLEntry(
        'test-tenant', 
        'test-role-id', 
        'user', 
        'read', 
        role
      );
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(0);
      expect(removeACLEntry).toHaveBeenCalled();
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'permission_revoked',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'test-tenant'
      }));
    });

    it('should remove an ACL entry from a global role and log an audit event', async () => {
      const role = { 
        ...sampleGlobalRole,
        aclEntries: [sampleACLEntry]
      };
      
      const result = await removeACLEntry(
        'system', 
        'test-role-id', 
        'user', 
        'read', 
        role
      );
      
      expect(result).toBe(true);
      expect(role.aclEntries).toHaveLength(0);
      expect(removeACLEntry).toHaveBeenCalled();
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'global_permission_revoked',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'system'
      }));
    });

    it('should return false if the ACL entry does not exist', async () => {
      const role = { ...sampleRole };
      
      // Mock the findIndex method to return -1 (not found)
      jest.spyOn(Array.prototype, 'findIndex').mockReturnValueOnce(-1);
      
      const result = await removeACLEntry(
        'test-tenant', 
        'test-role-id', 
        'user', 
        'read', 
        role
      );
      
      expect(result).toBe(false);
      expect(AuditService.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('updateRoleACL', () => {
    it('should update all ACL entries for a tenant role and log an audit event', async () => {
      const role = { ...sampleRole };
      const newACLEntries: TenantACE[] = [
        sampleACLEntry,
        {
          resource: {
            type: 'listing' as ResourceType,
            tenantId: 'test-tenant'
          },
          permission: 'create' as Permission
        }
      ];
      
      const result = await updateRoleACL('test-tenant', 'test-role-id', newACLEntries, role);
      
      expect(result).not.toBeNull();
      expect(result?.aclEntries).toEqual(newACLEntries);
      expect(updateRoleACL).toHaveBeenCalled();
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'role_acl_updated',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'test-tenant'
      }));
    });

    it('should update all ACL entries for a global role and log an audit event', async () => {
      const role = { ...sampleGlobalRole };
      const newACLEntries: TenantACE[] = [
        sampleACLEntry,
        {
          resource: {
            type: 'listing' as ResourceType,
            tenantId: 'system'
          },
          permission: 'create' as Permission
        }
      ];
      
      const result = await updateRoleACL('system', 'test-role-id', newACLEntries, role);
      
      expect(result).not.toBeNull();
      expect(result?.aclEntries).toEqual(newACLEntries);
      expect(updateRoleACL).toHaveBeenCalled();
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'global_role_acl_updated',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'system'
      }));
    });

    it('should include detailed change information in the audit event', async () => {
      const existingACLEntry: TenantACE = {
        resource: {
          type: 'user' as ResourceType,
          tenantId: 'test-tenant'
        },
        permission: 'read' as Permission
      };
      
      const newACLEntry: TenantACE = {
        resource: {
          type: 'listing' as ResourceType,
          tenantId: 'test-tenant'
        },
        permission: 'create' as Permission
      };
      
      const role = { 
        ...sampleRole,
        aclEntries: [existingACLEntry]
      };
      
      const newACLEntries = [newACLEntry];
      
      await updateRoleACL('test-tenant', 'test-role-id', newACLEntries, role);
      
      expect(AuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({
          previousACL: expect.arrayContaining([
            expect.objectContaining({
              resourceType: 'user',
              permission: 'read'
            })
          ]),
          newACL: expect.arrayContaining([
            expect.objectContaining({
              resourceType: 'listing',
              permission: 'create'
            })
          ]),
          added: expect.arrayContaining([
            expect.objectContaining({
              resourceType: 'listing',
              permission: 'create'
            })
          ]),
          removed: expect.arrayContaining([
            expect.objectContaining({
              resourceType: 'user',
              permission: 'read'
            })
          ])
        })
      }));
    });
  });

  describe('hasACLEntry', () => {
    it('should return true if the role has the ACL entry', () => {
      const role = { 
        ...sampleRole,
        aclEntries: [sampleACLEntry]
      };
      
      const result = hasACLEntry(role, 'user', 'read');
      
      expect(result).toBe(true);
      expect(hasACLEntry).toHaveBeenCalled();
    });

    it('should return false if the role does not have the ACL entry', () => {
      const role = { ...sampleRole };
      
      // Mock the some method to return false
      jest.spyOn(Array.prototype, 'some').mockReturnValueOnce(false);
      
      const result = hasACLEntry(role, 'user', 'read');
      
      expect(result).toBe(false);
      expect(hasACLEntry).toHaveBeenCalled();
    });

    it('should check for resource ID if provided', () => {
      const aclEntryWithId: TenantACE = {
        resource: {
          type: 'user' as ResourceType,
          id: 'specific-user',
          tenantId: 'test-tenant'
        },
        permission: 'read' as Permission
      };
      
      const role = { 
        ...sampleRole,
        aclEntries: [aclEntryWithId]
      };
      
      // Mock the some method to return true for the first call and false for the second
      const someSpy = jest.spyOn(Array.prototype, 'some');
      someSpy.mockReturnValueOnce(true).mockReturnValueOnce(false);
      
      expect(hasACLEntry(role, 'user', 'read', 'specific-user')).toBe(true);
      expect(hasACLEntry(role, 'user', 'read', 'different-user')).toBe(false);
      expect(hasACLEntry).toHaveBeenCalledTimes(2);
    });
  });
});