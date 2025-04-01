/**
 * Tenant Role Audit Logging
 *
 * This file contains the implementation of audit logging for tenant role operations.
 */

import AuditService from '@/lib/audit/audit-service';
import { Role } from '@/components/admin/auth/utils/roles';

/**
 * Log an audit event for tenant role update
 * @param roleId Role ID
 * @param tenantId Tenant ID
 * @param roleName Role name
 * @param updates Object keys that were updated
 */
export async function logTenantRoleUpdate(
  roleId: string,
  tenantId: string,
  roleName: string,
  updates: string[]
): Promise<void> {
  await AuditService.logEvent({
    action: 'role_updated',
    resourceType: 'role',
    resourceId: roleId,
    tenantId: tenantId,
    details: {
      roleName: roleName,
      updates: updates
    }
  });
}

/**
 * Log an audit event for tenant role deletion
 * @param roleId Role ID
 * @param tenantId Tenant ID
 * @param roleName Role name
 */
export async function logTenantRoleDelete(
  roleId: string,
  tenantId: string,
  roleName: string
): Promise<void> {
  await AuditService.logEvent({
    action: 'role_deleted',
    resourceType: 'role',
    resourceId: roleId,
    tenantId: tenantId,
    details: {
      roleName: roleName
    }
  });
}