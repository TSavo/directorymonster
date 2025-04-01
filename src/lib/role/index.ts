/**
 * Role Service - Centralized exports
 *
 * This module provides methods for managing roles and user-role assignments
 * with tenant isolation for multi-tenancy support.
 * Enhanced with global roles functionality that works across tenant boundaries.
 */

// Import all functions first so we can use them in the RoleService class
import {
  createRole as createRoleOp,
  createGlobalRole as createGlobalRoleOp,
  getRole as getRoleOp,
  getGlobalRole as getGlobalRoleOp,
  getGlobalRoles as getGlobalRolesOp,
  updateRole as updateRoleOp
} from './role-operations';

import {
  assignRoleToUser as assignRoleToUserOp,
  removeRoleFromUser as removeRoleFromUserOp,
  getUserRoles as getUserRolesOp,
  hasRoleInTenant as hasRoleInTenantOp,
  hasSpecificRole as hasSpecificRoleOp
} from './user-role-management';

// Import compatibility functions
import { assignGlobalRoleToUser as assignGlobalRoleToUserOp } from '../role-service/role-service-compat';

import {
  hasPermission as hasPermissionOp,
  getUserGlobalRoles as getUserGlobalRolesOp,
  hasGlobalPermission as hasGlobalPermissionOp,
  hasGlobalRole as hasGlobalRoleOp,
  hasGlobalPermissionAnyTenant as hasGlobalPermissionAnyTenantOp
} from './permission-management';

import {
  deleteRole as deleteRoleOp,
  getUsersWithRole as getUsersWithRoleOp,
  getUsersWithGlobalRole as getUsersWithGlobalRoleOp
} from './role-deletion';

import {
  getRolesByTenant as getRolesByTenantOp
} from './tenant-role-operations';

// Re-export constants and utility functions
export * from './constants';
export * from './utils';

// Re-export role operations
export const createRole = createRoleOp;
export const createGlobalRole = createGlobalRoleOp;
export const getRole = getRoleOp;
export const getGlobalRole = getGlobalRoleOp;
export const getGlobalRoles = getGlobalRolesOp;
export const updateRole = updateRoleOp;

// Re-export user-role management
export const assignRoleToUser = assignRoleToUserOp;
export const removeRoleFromUser = removeRoleFromUserOp;
export const getUserRoles = getUserRolesOp;
export const hasRoleInTenant = hasRoleInTenantOp;
export const hasSpecificRole = hasSpecificRoleOp;
export const assignGlobalRoleToUser = assignGlobalRoleToUserOp;

// Re-export permission management
export const hasPermission = hasPermissionOp;
export const getUserGlobalRoles = getUserGlobalRolesOp;
export const hasGlobalPermission = hasGlobalPermissionOp;
export const hasGlobalRole = hasGlobalRoleOp;
export const hasGlobalPermissionAnyTenant = hasGlobalPermissionAnyTenantOp;

// Re-export role deletion
export const deleteRole = deleteRoleOp;
export const getUsersWithRole = getUsersWithRoleOp;
export const getUsersWithGlobalRole = getUsersWithGlobalRoleOp;

// Re-export tenant-specific operations
export const getRolesByTenant = getRolesByTenantOp;

/**
 * RoleService class that provides a centralized interface to all role management operations
 */
export class RoleService {
  // Role operations
  static createRole = createRoleOp;
  static createGlobalRole = createGlobalRoleOp;
  static getRole = getRoleOp;
  static getGlobalRole = getGlobalRoleOp;
  static getGlobalRoles = getGlobalRolesOp;
  static updateRole = updateRoleOp;
  static deleteRole = deleteRoleOp;

  // User-role management
  static assignRoleToUser = assignRoleToUserOp;
  static assignGlobalRoleToUser = assignGlobalRoleToUserOp;
  static removeRoleFromUser = removeRoleFromUserOp;
  static getUserRoles = getUserRolesOp;
  static hasRoleInTenant = hasRoleInTenantOp;
  static hasSpecificRole = hasSpecificRoleOp;

  // Permission management
  static hasPermission = hasPermissionOp;
  static getUserGlobalRoles = getUserGlobalRolesOp;
  static hasGlobalPermission = hasGlobalPermissionOp;
  static hasGlobalRole = hasGlobalRoleOp;
  static hasGlobalPermissionAnyTenant = hasGlobalPermissionAnyTenantOp;

  // Role deletion
  static getUsersWithRole = getUsersWithRoleOp;
  static getUsersWithGlobalRole = getUsersWithGlobalRoleOp;

  // Tenant-specific operations
  static getRolesByTenant = getRolesByTenantOp;
}

// Default export for backward compatibility
export default RoleService;
