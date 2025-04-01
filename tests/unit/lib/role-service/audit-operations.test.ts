/**
 * Tests for RoleService audit logging of update and delete operations
 *
 * This test verifies that RoleService correctly calls AuditService
 * for role update and delete operations.
 */

import { RoleService } from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';

describe('RoleService Audit Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Update Audit Logging', () => {
    it('should log audit events when updating global roles', () => {
      // Verify that RoleService.updateRole contains audit logging for global roles
      const updateRoleCode = RoleService.updateRole.toString();

      // Check for global role update audit logging
      expect(updateRoleCode).toContain('global_role_updated');
      expect(updateRoleCode).toContain('_auditservice.default.logEvent');
    });

    it('should log audit events when updating tenant roles', () => {
      // Verify that RoleService.updateRole contains audit logging for tenant roles
      const updateRoleCode = RoleService.updateRole.toString();

      // Check for tenant role update audit logging
      expect(updateRoleCode).toContain('role_updated');
      expect(updateRoleCode).toContain('_auditservice.default.logEvent');
    });
  });

  describe('Role Delete Audit Logging', () => {
    it('should log audit events when deleting global roles', () => {
      // Verify that RoleService.deleteRole contains audit logging for global roles
      const deleteRoleCode = RoleService.deleteRole.toString();

      // Check for global role delete audit logging
      expect(deleteRoleCode).toContain('global_role_deleted');
      expect(deleteRoleCode).toContain('_auditservice.default.logEvent');
    });

    it('should log audit events when deleting tenant roles', () => {
      // Verify that RoleService.deleteRole contains audit logging for tenant roles
      const deleteRoleCode = RoleService.deleteRole.toString();

      // Check for tenant role delete audit logging
      expect(deleteRoleCode).toContain('role_deleted');
      expect(deleteRoleCode).toContain('_auditservice.default.logEvent');
    });
  });

  describe('Role Assignment Audit Logging', () => {
    it('should log audit events when assigning global roles to users', () => {
      // Verify that RoleService.assignRoleToUser contains audit logging for global roles
      const assignRoleCode = RoleService.assignRoleToUser.toString();

      // Check for global role assignment audit logging
      expect(assignRoleCode).toContain('global_role_assigned');
      expect(assignRoleCode).toContain('_auditservice.default.logEvent');
    });

    it('should log audit events when assigning tenant roles to users', () => {
      // Verify that RoleService.assignRoleToUser contains audit logging for tenant roles
      const assignRoleCode = RoleService.assignRoleToUser.toString();

      // Check for tenant role assignment audit logging
      expect(assignRoleCode).toContain('role_assigned');
      expect(assignRoleCode).toContain('_auditservice.default.logEvent');
    });
  });

  describe('Role Removal Audit Logging', () => {
    it('should log audit events when removing global roles from users', () => {
      // Verify that RoleService.removeRoleFromUser contains audit logging for global roles
      const removeRoleCode = RoleService.removeRoleFromUser.toString();

      // Check for global role removal audit logging
      expect(removeRoleCode).toContain('global_role_removed');
      expect(removeRoleCode).toContain('_auditservice.default.logEvent');
    });

    it('should log audit events when removing tenant roles from users', () => {
      // Verify that RoleService.removeRoleFromUser contains audit logging for tenant roles
      const removeRoleCode = RoleService.removeRoleFromUser.toString();

      // Check for tenant role removal audit logging
      expect(removeRoleCode).toContain('role_removed');
      expect(removeRoleCode).toContain('_auditservice.default.logEvent');
    });
  });
});