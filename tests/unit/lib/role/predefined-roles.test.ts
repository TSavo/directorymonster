import { v4 as uuidv4 } from 'uuid';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

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
    kv: mockRedis,
  };
});

describe('PredefinedRoles', () => {
  const testTenantId = 'tenant_' + uuidv4();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should have methods to create predefined roles', async () => {
    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');

    // Verify the methods exist
    expect(typeof PredefinedRoles.createAllRoles).toBe('function');
    expect(typeof PredefinedRoles.createTenantRoles).toBe('function');
    expect(typeof PredefinedRoles.createSiteRoles).toBe('function');
  });

  it('should have a getPredefinedRole method', async () => {
    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');

    // Verify the method exists
    expect(typeof PredefinedRoles.getPredefinedRole).toBe('function');
  });

  it('should define a set of predefined roles', async () => {
    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');

    // Verify tenant-wide roles exist
    expect(PredefinedRoles.TENANT_ADMIN_ROLE).toBeDefined();
    expect(PredefinedRoles.TENANT_EDITOR_ROLE).toBeDefined();
    expect(PredefinedRoles.TENANT_AUTHOR_ROLE).toBeDefined();
    expect(PredefinedRoles.TENANT_VIEWER_ROLE).toBeDefined();

    // Verify site-specific roles exist
    expect(PredefinedRoles.SITE_ADMIN_ROLE).toBeDefined();
    expect(PredefinedRoles.SITE_EDITOR_ROLE).toBeDefined();
    expect(PredefinedRoles.SITE_AUTHOR_ROLE).toBeDefined();
    expect(PredefinedRoles.SITE_VIEWER_ROLE).toBeDefined();
  });

  it('should create tenant-wide predefined roles in a tenant', async () => {
    // Mock the RoleService
    jest.mock('@/lib/role/role-service', () => ({
      RoleService: {
        createRole: jest.fn().mockImplementation((role) => Promise.resolve({
          ...role,
          id: 'role_' + uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        getRoleByName: jest.fn().mockResolvedValue(null),
      },
    }));

    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');
    const { RoleService } = require('@/lib/role/role-service');

    // Call the method
    const roles = await PredefinedRoles.createTenantRoles(testTenantId);

    // Verify RoleService.createRole was called for each predefined role
    expect(RoleService.createRole).toHaveBeenCalledTimes(4);

    // Verify the returned roles
    expect(roles).toHaveLength(4);
    expect(roles[0].name).toBe('Tenant Admin');
    expect(roles[1].name).toBe('Tenant Editor');
    expect(roles[2].name).toBe('Tenant Author');
    expect(roles[3].name).toBe('Tenant Viewer');
  });

  it('should create site-specific predefined roles in a tenant', async () => {
    // Mock the RoleService
    jest.mock('@/lib/role/role-service', () => ({
      RoleService: {
        createRole: jest.fn().mockImplementation((role) => Promise.resolve({
          ...role,
          id: 'role_' + uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        getRoleByName: jest.fn().mockResolvedValue(null),
      },
    }));

    const testSiteId = 'site_' + uuidv4();

    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');
    const { RoleService } = require('@/lib/role/role-service');

    // Call the method
    const roles = await PredefinedRoles.createSiteRoles(testTenantId, testSiteId);

    // Verify RoleService.createRole was called for each predefined role
    expect(RoleService.createRole).toHaveBeenCalledTimes(4);

    // Verify the returned roles
    expect(roles).toHaveLength(4);
    expect(roles[0].name).toBe('Site Admin');
    expect(roles[1].name).toBe('Site Editor');
    expect(roles[2].name).toBe('Site Author');
    expect(roles[3].name).toBe('Site Viewer');

    // Verify site ID is included in the ACL entries
    roles.forEach(role => {
      role.aclEntries.forEach(entry => {
        if (entry.resource.type === 'category' || entry.resource.type === 'listing') {
          expect(entry.resource.siteId).toBe(testSiteId);
        }
      });
    });
  });

  it('should create all predefined roles in a tenant', async () => {
    // Mock the RoleService
    jest.mock('@/lib/role/role-service', () => ({
      RoleService: {
        createRole: jest.fn().mockImplementation((role) => Promise.resolve({
          ...role,
          id: 'role_' + uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        getRoleByName: jest.fn().mockResolvedValue(null),
      },
    }));

    const testSiteId = 'site_' + uuidv4();

    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');
    const { RoleService } = require('@/lib/role/role-service');

    // Call the method
    const roles = await PredefinedRoles.createAllRoles(testTenantId, testSiteId);

    // Verify RoleService.createRole was called for each predefined role (8 total: 4 tenant + 4 site)
    expect(RoleService.createRole).toHaveBeenCalledTimes(8);

    // Verify the returned roles
    expect(roles).toHaveLength(8);

    // Verify tenant roles
    expect(roles.some(role => role.name === 'Tenant Admin')).toBe(true);
    expect(roles.some(role => role.name === 'Tenant Editor')).toBe(true);
    expect(roles.some(role => role.name === 'Tenant Author')).toBe(true);
    expect(roles.some(role => role.name === 'Tenant Viewer')).toBe(true);

    // Verify site roles
    expect(roles.some(role => role.name === 'Site Admin')).toBe(true);
    expect(roles.some(role => role.name === 'Site Editor')).toBe(true);
    expect(roles.some(role => role.name === 'Site Author')).toBe(true);
    expect(roles.some(role => role.name === 'Site Viewer')).toBe(true);
  });

  it('should not create tenant roles that already exist', async () => {
    // Mock the RoleService
    jest.mock('@/lib/role/role-service', () => ({
      RoleService: {
        createRole: jest.fn().mockImplementation((role) => Promise.resolve({
          ...role,
          id: 'role_' + uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        getRoleByName: jest.fn().mockImplementation((tenantId, name) => {
          if (name === 'Tenant Admin') {
            return Promise.resolve({
              id: 'existing_admin_role',
              name: 'Tenant Admin',
              description: 'Existing admin role',
              tenantId,
              isGlobal: false,
              aclEntries: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          return Promise.resolve(null);
        }),
      },
    }));

    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');
    const { RoleService } = require('@/lib/role/role-service');

    // Call the method
    const roles = await PredefinedRoles.createTenantRoles(testTenantId);

    // Verify RoleService.createRole was called only for non-existing roles
    expect(RoleService.createRole).toHaveBeenCalledTimes(3);

    // Verify the returned roles
    expect(roles).toHaveLength(4);
    expect(roles[0].id).toBe('existing_admin_role');
    expect(roles[0].name).toBe('Tenant Admin');
  });

  it('should not create site roles that already exist', async () => {
    // Mock the RoleService
    jest.mock('@/lib/role/role-service', () => ({
      RoleService: {
        createRole: jest.fn().mockImplementation((role) => Promise.resolve({
          ...role,
          id: 'role_' + uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        getRoleByName: jest.fn().mockImplementation((tenantId, name) => {
          if (name === 'Site Editor') {
            return Promise.resolve({
              id: 'existing_editor_role',
              name: 'Site Editor',
              description: 'Existing editor role',
              tenantId,
              isGlobal: false,
              aclEntries: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          return Promise.resolve(null);
        }),
      },
    }));

    const testSiteId = 'site_' + uuidv4();

    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');
    const { RoleService } = require('@/lib/role/role-service');

    // Call the method
    const roles = await PredefinedRoles.createSiteRoles(testTenantId, testSiteId);

    // Verify RoleService.createRole was called only for non-existing roles
    expect(RoleService.createRole).toHaveBeenCalledTimes(3);

    // Verify the returned roles
    expect(roles).toHaveLength(4);
    expect(roles[1].id).toBe('existing_editor_role');
    expect(roles[1].name).toBe('Site Editor');
  });

  it('should get a predefined role by name', async () => {
    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');

    // Call the method for tenant roles
    const tenantAdminRole = PredefinedRoles.getPredefinedRole('Tenant Admin');
    const tenantEditorRole = PredefinedRoles.getPredefinedRole('Tenant Editor');
    const tenantAuthorRole = PredefinedRoles.getPredefinedRole('Tenant Author');
    const tenantViewerRole = PredefinedRoles.getPredefinedRole('Tenant Viewer');

    // Call the method for site roles
    const siteAdminRole = PredefinedRoles.getPredefinedRole('Site Admin');
    const siteEditorRole = PredefinedRoles.getPredefinedRole('Site Editor');
    const siteAuthorRole = PredefinedRoles.getPredefinedRole('Site Author');
    const siteViewerRole = PredefinedRoles.getPredefinedRole('Site Viewer');

    const nonExistentRole = PredefinedRoles.getPredefinedRole('NonExistent');

    // Verify the returned tenant roles
    expect(tenantAdminRole).toBeDefined();
    expect(tenantAdminRole?.name).toBe('Tenant Admin');
    expect(tenantEditorRole).toBeDefined();
    expect(tenantEditorRole?.name).toBe('Tenant Editor');
    expect(tenantAuthorRole).toBeDefined();
    expect(tenantAuthorRole?.name).toBe('Tenant Author');
    expect(tenantViewerRole).toBeDefined();
    expect(tenantViewerRole?.name).toBe('Tenant Viewer');

    // Verify the returned site roles
    expect(siteAdminRole).toBeDefined();
    expect(siteAdminRole?.name).toBe('Site Admin');
    expect(siteEditorRole).toBeDefined();
    expect(siteEditorRole?.name).toBe('Site Editor');
    expect(siteAuthorRole).toBeDefined();
    expect(siteAuthorRole?.name).toBe('Site Author');
    expect(siteViewerRole).toBeDefined();
    expect(siteViewerRole?.name).toBe('Site Viewer');

    expect(nonExistentRole).toBeNull();
  });

  it('should define appropriate permissions for tenant roles', async () => {
    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');

    // Get the predefined tenant roles
    const adminRole = PredefinedRoles.getPredefinedRole('Tenant Admin');
    const editorRole = PredefinedRoles.getPredefinedRole('Tenant Editor');
    const authorRole = PredefinedRoles.getPredefinedRole('Tenant Author');
    const viewerRole = PredefinedRoles.getPredefinedRole('Tenant Viewer');

    // Verify admin role has all permissions
    expect(adminRole?.aclEntries).toBeDefined();
    expect(adminRole?.aclEntries.length).toBeGreaterThan(0);

    // Check if admin has manage permission for all resource types
    const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
    resourceTypes.forEach(type => {
      const hasManagePermission = adminRole?.aclEntries.some(
        entry => entry.resource.type === type && entry.permission === 'manage'
      );
      expect(hasManagePermission).toBe(true);
    });

    // Verify editor role has edit permissions but not manage
    expect(editorRole?.aclEntries).toBeDefined();
    expect(editorRole?.aclEntries.length).toBeGreaterThan(0);

    // Check if editor has create, read, update permissions for content types
    const contentTypes: ResourceType[] = ['category', 'listing'];
    const editorPermissions: Permission[] = ['create', 'read', 'update'];

    contentTypes.forEach(type => {
      editorPermissions.forEach(permission => {
        const hasPermission = editorRole?.aclEntries.some(
          entry => entry.resource.type === type && entry.permission === permission
        );
        expect(hasPermission).toBe(true);
      });

      // Editor should not have manage permission
      const hasManagePermission = editorRole?.aclEntries.some(
        entry => entry.resource.type === type && entry.permission === 'manage'
      );
      expect(hasManagePermission).toBe(false);
    });

    // Verify author role has limited permissions
    expect(authorRole?.aclEntries).toBeDefined();
    expect(authorRole?.aclEntries.length).toBeGreaterThan(0);

    // Check if author has create and read permissions for listings
    const authorPermissions: Permission[] = ['create', 'read'];

    authorPermissions.forEach(permission => {
      const hasPermission = authorRole?.aclEntries.some(
        entry => entry.resource.type === 'listing' && entry.permission === permission
      );
      expect(hasPermission).toBe(true);
    });

    // Author should not have update permission for categories
    const hasUpdateCategoryPermission = authorRole?.aclEntries.some(
      entry => entry.resource.type === 'category' && entry.permission === 'update'
    );
    expect(hasUpdateCategoryPermission).toBe(false);

    // Verify viewer role has only read permissions
    expect(viewerRole?.aclEntries).toBeDefined();
    expect(viewerRole?.aclEntries.length).toBeGreaterThan(0);

    // Check if viewer has only read permissions
    resourceTypes.forEach(type => {
      const hasReadPermission = viewerRole?.aclEntries.some(
        entry => entry.resource.type === type && entry.permission === 'read'
      );

      // Viewer should have read permission for all resource types
      expect(hasReadPermission).toBe(true);

      // Viewer should not have other permissions
      const otherPermissions: Permission[] = ['create', 'update', 'delete', 'manage'];
      otherPermissions.forEach(permission => {
        const hasOtherPermission = viewerRole?.aclEntries.some(
          entry => entry.resource.type === type && entry.permission === permission
        );
        expect(hasOtherPermission).toBe(false);
      });
    });
  });

  it('should define appropriate permissions for site roles', async () => {
    // Import the service
    const { PredefinedRoles } = require('@/lib/role/predefined-roles');

    // Get the predefined site roles
    const adminRole = PredefinedRoles.getPredefinedRole('Site Admin');
    const editorRole = PredefinedRoles.getPredefinedRole('Site Editor');
    const authorRole = PredefinedRoles.getPredefinedRole('Site Author');
    const viewerRole = PredefinedRoles.getPredefinedRole('Site Viewer');

    // Verify site roles have siteId placeholder in their ACL entries
    const contentTypes: ResourceType[] = ['category', 'listing'];

    contentTypes.forEach(type => {
      // Admin should have site-specific permissions
      const adminEntries = adminRole?.aclEntries.filter(
        entry => entry.resource.type === type
      );
      expect(adminEntries?.length).toBeGreaterThan(0);
      adminEntries?.forEach(entry => {
        expect(entry.resource.siteId).toBe('{siteId}');
      });

      // Editor should have site-specific permissions
      const editorEntries = editorRole?.aclEntries.filter(
        entry => entry.resource.type === type
      );
      expect(editorEntries?.length).toBeGreaterThan(0);
      editorEntries?.forEach(entry => {
        expect(entry.resource.siteId).toBe('{siteId}');
      });

      // Author should have site-specific permissions
      const authorEntries = authorRole?.aclEntries.filter(
        entry => entry.resource.type === type
      );
      expect(authorEntries?.length).toBeGreaterThan(0);
      authorEntries?.forEach(entry => {
        expect(entry.resource.siteId).toBe('{siteId}');
      });

      // Viewer should have site-specific permissions
      const viewerEntries = viewerRole?.aclEntries.filter(
        entry => entry.resource.type === type
      );
      expect(viewerEntries?.length).toBeGreaterThan(0);
      viewerEntries?.forEach(entry => {
        expect(entry.resource.siteId).toBe('{siteId}');
      });
    });
  });
});
