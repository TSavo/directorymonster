/**
 * Type definitions for the Unified Role-ACL Model
 */

// Resource types in the system
export type ResourceType = 'user' | 'site' | 'category' | 'listing' | 'setting' | 'tenant';

// Available permissions
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Resource identifier
export interface Resource {
  type: ResourceType;
  id?: string;        // Specific resource ID (if null, applies to all resources of this type)
  tenantId: string;   // The tenant this resource belongs to
  siteId?: string;    // The site this resource belongs to (if null, applies to all sites in the tenant)
}

// Access control entry
export interface ACE {
  resource: Resource;
  permission: Permission;
}

// Role definition
export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;         // The tenant this role belongs to (null for global roles)
  isGlobal: boolean;        // Whether this role applies across all tenants
  aclEntries: ACE[];        // The permissions this role grants
  createdAt: string;
  updatedAt: string;
}

// User-Role assignment
export interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;  // The tenant context for this role assignment
  assignedAt: string;
}