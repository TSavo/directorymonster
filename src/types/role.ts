/**
 * Role types and interfaces for the role management system
 */

/**
 * Role scope enum
 */
export enum RoleScope {
  GLOBAL = 'global',
  TENANT = 'tenant',
  SITE = 'site'
}

/**
 * Role type enum
 */
export enum RoleType {
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

/**
 * Permission action type
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

/**
 * Permission resource type
 */
export type ResourceType = 'user' | 'role' | 'site' | 'category' | 'listing' | 'content' | 'setting' | 'tenant' | 'audit';

/**
 * Permission interface
 */
export interface Permission {
  resource: ResourceType;
  actions: PermissionAction[];
  siteId?: string;
  resourceId?: string;
}

/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  scope: RoleScope;
  tenantId: string;
  siteId?: string;
  permissions: Permission[];
  userCount: number;
  isDefault?: boolean;
  canModify?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role filter interface
 */
export interface RoleFilter {
  search?: string;
  scope?: RoleScope;
  type?: RoleType;
  siteId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Role pagination interface
 */
export interface RolePagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
