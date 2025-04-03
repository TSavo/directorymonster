import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { RoleService } from '@/lib/role/role-service';

/**
 * Interface for ACL entry
 */
interface ACE {
  resource: {
    type: ResourceType;
    id?: string;
    tenantId: string;
    siteId?: string;
  };
  permission: Permission;
}

/**
 * Interface for role template
 */
interface RoleTemplate {
  name: string;
  description: string;
  aclEntries: ACE[];
  isGlobal: boolean;
}

/**
 * Interface for role
 */
interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  isGlobal: boolean;
  aclEntries: ACE[];
  createdAt: string;
  updatedAt: string;
}

/**
 * PredefinedRoles provides standard role templates and utilities
 * for creating and managing predefined roles in the system.
 */
export class PredefinedRoles {
  /**
   * Tenant Admin role template with full permissions across all sites
   */
  static TENANT_ADMIN_ROLE: RoleTemplate = {
    name: 'Tenant Admin',
    description: 'Full administrative access to all resources across all sites',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Tenant Editor role template with content management permissions across all sites
   */
  static TENANT_EDITOR_ROLE: RoleTemplate = {
    name: 'Tenant Editor',
    description: 'Can create, edit, and publish content across all sites',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Tenant Author role template with content creation permissions across all sites
   */
  static TENANT_AUTHOR_ROLE: RoleTemplate = {
    name: 'Tenant Author',
    description: 'Can create and edit their own content across all sites',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Tenant Viewer role template with read-only permissions across all sites
   */
  static TENANT_VIEWER_ROLE: RoleTemplate = {
    name: 'Tenant Viewer',
    description: 'Read-only access to content across all sites',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Site Admin role template with full permissions for a specific site
   */
  static SITE_ADMIN_ROLE: RoleTemplate = {
    name: 'Site Admin',
    description: 'Full administrative access to a specific site',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Site Editor role template with content management permissions for a specific site
   */
  static SITE_EDITOR_ROLE: RoleTemplate = {
    name: 'Site Editor',
    description: 'Can create, edit, and publish content for a specific site',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Site Author role template with content creation permissions for a specific site
   */
  static SITE_AUTHOR_ROLE: RoleTemplate = {
    name: 'Site Author',
    description: 'Can create and edit their own content for a specific site',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Site Viewer role template with read-only permissions for a specific site
   */
  static SITE_VIEWER_ROLE: RoleTemplate = {
    name: 'Site Viewer',
    description: 'Read-only access to content for a specific site',
    isGlobal: false,
    aclEntries: []
  };

  /**
   * Initialize the predefined roles with their permissions
   */
  static {
    // Define resource types
    const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
    const contentTypes: ResourceType[] = ['category', 'listing'];
    const siteSpecificTypes: ResourceType[] = ['category', 'listing'];

    // Define permissions
    const allPermissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
    const editPermissions: Permission[] = ['create', 'read', 'update'];
    const authorPermissions: Permission[] = ['create', 'read'];
    const viewPermissions: Permission[] = ['read'];

    // Set up Tenant Admin role with full permissions across all sites
    resourceTypes.forEach(type => {
      this.TENANT_ADMIN_ROLE.aclEntries.push({
        resource: { type, tenantId: '{tenantId}' },
        permission: 'manage'
      });
    });

    // Set up Tenant Editor role with content management permissions across all sites
    contentTypes.forEach(type => {
      editPermissions.forEach(permission => {
        this.TENANT_EDITOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission
        });
      });
    });

    // Add read permissions for other resource types
    resourceTypes
      .filter(type => !contentTypes.includes(type))
      .forEach(type => {
        this.TENANT_EDITOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
      });

    // Set up Tenant Author role with content creation permissions across all sites
    contentTypes.forEach(type => {
      if (type === 'listing') {
        // Authors can create and read listings
        this.TENANT_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'create'
        });
        this.TENANT_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
        this.TENANT_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'update'
        });
      } else {
        // Authors can only read categories
        this.TENANT_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
      }
    });

    // Add read permissions for all resource types
    resourceTypes.forEach(type => {
      this.TENANT_AUTHOR_ROLE.aclEntries.push({
        resource: { type, tenantId: '{tenantId}' },
        permission: 'read'
      });
    });

    // Set up Tenant Viewer role with read-only permissions across all sites
    resourceTypes.forEach(type => {
      this.TENANT_VIEWER_ROLE.aclEntries.push({
        resource: { type, tenantId: '{tenantId}' },
        permission: 'read'
      });
    });

    // Set up Site Admin role with full permissions for a specific site
    resourceTypes.forEach(type => {
      if (siteSpecificTypes.includes(type)) {
        this.SITE_ADMIN_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission: 'manage'
        });
      } else {
        this.SITE_ADMIN_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
      }
    });

    // Set up Site Editor role with content management permissions for a specific site
    contentTypes.forEach(type => {
      editPermissions.forEach(permission => {
        this.SITE_EDITOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission
        });
      });
    });

    // Add read permissions for other resource types
    resourceTypes
      .filter(type => !contentTypes.includes(type))
      .forEach(type => {
        this.SITE_EDITOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
      });

    // Set up Site Author role with content creation permissions for a specific site
    contentTypes.forEach(type => {
      if (type === 'listing') {
        // Authors can create, read, and update listings
        this.SITE_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission: 'create'
        });
        this.SITE_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission: 'read'
        });
        this.SITE_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission: 'update'
        });
      } else {
        // Authors can only read categories
        this.SITE_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission: 'read'
        });
      }
    });

    // Add read permissions for all resource types
    resourceTypes
      .filter(type => !contentTypes.includes(type))
      .forEach(type => {
        this.SITE_AUTHOR_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
      });

    // Set up Site Viewer role with read-only permissions for a specific site
    resourceTypes.forEach(type => {
      if (siteSpecificTypes.includes(type)) {
        this.SITE_VIEWER_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}', siteId: '{siteId}' },
          permission: 'read'
        });
      } else {
        this.SITE_VIEWER_ROLE.aclEntries.push({
          resource: { type, tenantId: '{tenantId}' },
          permission: 'read'
        });
      }
    });
  }

  /**
   * Get a predefined role template by name
   *
   * @param name The name of the predefined role
   * @returns The role template or null if not found
   */
  static getPredefinedRole(name: string): RoleTemplate | null {
    switch (name) {
      case 'Tenant Admin':
        return this.TENANT_ADMIN_ROLE;
      case 'Tenant Editor':
        return this.TENANT_EDITOR_ROLE;
      case 'Tenant Author':
        return this.TENANT_AUTHOR_ROLE;
      case 'Tenant Viewer':
        return this.TENANT_VIEWER_ROLE;
      case 'Site Admin':
        return this.SITE_ADMIN_ROLE;
      case 'Site Editor':
        return this.SITE_EDITOR_ROLE;
      case 'Site Author':
        return this.SITE_AUTHOR_ROLE;
      case 'Site Viewer':
        return this.SITE_VIEWER_ROLE;
      default:
        return null;
    }
  }

  /**
   * Create all predefined roles (tenant-wide and site-specific) in a tenant
   *
   * @param tenantId The ID of the tenant
   * @param siteId The ID of the site for site-specific roles
   * @returns Array of created roles
   */
  static async createAllRoles(tenantId: string, siteId: string): Promise<Role[]> {
    // Create tenant-wide roles
    const tenantRoles = await this.createTenantRoles(tenantId);

    // Create site-specific roles
    const siteRoles = await this.createSiteRoles(tenantId, siteId);

    // Combine and return all roles
    return [...tenantRoles, ...siteRoles];
  }

  /**
   * Create tenant-wide predefined roles in a tenant
   *
   * @param tenantId The ID of the tenant
   * @returns Array of created roles
   */
  static async createTenantRoles(tenantId: string): Promise<Role[]> {
    const roles: Role[] = [];

    // Create each predefined tenant role
    const roleTemplates = [
      this.TENANT_ADMIN_ROLE,
      this.TENANT_EDITOR_ROLE,
      this.TENANT_AUTHOR_ROLE,
      this.TENANT_VIEWER_ROLE
    ];

    for (const template of roleTemplates) {
      // Check if role already exists
      const existingRole = await RoleService.getRoleByName(tenantId, template.name);

      if (existingRole) {
        roles.push(existingRole);
        continue;
      }

      // Replace placeholder tenantId with actual tenantId
      const aclEntries = template.aclEntries.map(ace => ({
        ...ace,
        resource: {
          ...ace.resource,
          tenantId: ace.resource.tenantId.replace('{tenantId}', tenantId)
        }
      }));

      // Create the role
      const role = await RoleService.createRole({
        name: template.name,
        description: template.description,
        tenantId,
        isGlobal: template.isGlobal,
        aclEntries
      });

      roles.push(role);
    }

    return roles;
  }

  /**
   * Create site-specific predefined roles in a tenant
   *
   * @param tenantId The ID of the tenant
   * @param siteId The ID of the site
   * @returns Array of created roles
   */
  static async createSiteRoles(tenantId: string, siteId: string): Promise<Role[]> {
    const roles: Role[] = [];

    // Create each predefined site role
    const roleTemplates = [
      this.SITE_ADMIN_ROLE,
      this.SITE_EDITOR_ROLE,
      this.SITE_AUTHOR_ROLE,
      this.SITE_VIEWER_ROLE
    ];

    for (const template of roleTemplates) {
      // Check if role already exists
      const existingRole = await RoleService.getRoleByName(tenantId, template.name);

      if (existingRole) {
        roles.push(existingRole);
        continue;
      }

      // Replace placeholder tenantId and siteId with actual values
      const aclEntries = template.aclEntries.map(ace => ({
        ...ace,
        resource: {
          ...ace.resource,
          tenantId: ace.resource.tenantId.replace('{tenantId}', tenantId),
          siteId: ace.resource.siteId?.replace('{siteId}', siteId)
        }
      }));

      // Create the role
      const role = await RoleService.createRole({
        name: template.name,
        description: template.description,
        tenantId,
        isGlobal: template.isGlobal,
        aclEntries
      });

      roles.push(role);
    }

    return roles;
  }

  /**
   * Create a specific predefined role in a tenant
   *
   * @param tenantId The ID of the tenant
   * @param roleName The name of the predefined role
   * @param siteId The ID of the site (required for site-specific roles)
   * @returns The created role or null if the role template doesn't exist
   */
  static async createPredefinedRole(tenantId: string, roleName: string, siteId?: string): Promise<Role | null> {
    const template = this.getPredefinedRole(roleName);

    if (!template) {
      return null;
    }

    // Check if role already exists
    const existingRole = await RoleService.getRoleByName(tenantId, template.name);

    if (existingRole) {
      return existingRole;
    }

    // Check if this is a site-specific role and siteId is provided
    const isSiteRole = roleName.startsWith('Site ');
    if (isSiteRole && !siteId) {
      throw new Error(`Site ID is required for site-specific role: ${roleName}`);
    }

    // Replace placeholder tenantId and siteId with actual values
    const aclEntries = template.aclEntries.map(ace => ({
      ...ace,
      resource: {
        ...ace.resource,
        tenantId: ace.resource.tenantId.replace('{tenantId}', tenantId),
        siteId: ace.resource.siteId && siteId ? ace.resource.siteId.replace('{siteId}', siteId) : ace.resource.siteId
      }
    }));

    // Create the role
    const role = await RoleService.createRole({
      name: template.name,
      description: template.description,
      tenantId,
      isGlobal: template.isGlobal,
      aclEntries
    });

    return role;
  }
}
