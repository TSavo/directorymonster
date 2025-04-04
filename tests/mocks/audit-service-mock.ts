/**
 * Mock implementation of the audit service for testing
 */

import { v4 as uuidv4 } from 'uuid';

export class AuditServiceMock {
  static AUDIT_EVENT_PREFIX = 'audit:event:';
  static AUDIT_INDEX_PREFIX = 'audit:index:';
  static AUDIT_TENANT_PREFIX = 'audit:tenant:';
  static AUDIT_USER_PREFIX = 'audit:user:';
  static AUDIT_RESOURCE_PREFIX = 'audit:resource:';
  
  /**
   * Log an audit event
   */
  static async logEvent(event: any): Promise<any> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    const auditEvent = {
      ...event,
      id,
      timestamp,
      severity: 'INFO'
    };
    
    return auditEvent;
  }
  
  /**
   * Log a role-related audit event
   */
  static async logRoleEvent(
    userId: string,
    tenantId: string,
    action: string,
    roleId: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    return AuditServiceMock.logEvent({
      userId,
      tenantId,
      action,
      resourceType: 'role',
      resourceId: roleId,
      metadata
    });
  }
  
  /**
   * Log a user-related audit event
   */
  static async logUserEvent(
    actorId: string,
    tenantId: string,
    action: string,
    targetUserId: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    return AuditServiceMock.logEvent({
      userId: actorId,
      tenantId,
      action,
      resourceType: 'user',
      resourceId: targetUserId,
      metadata
    });
  }
  
  /**
   * Log a tenant-related audit event
   */
  static async logTenantEvent(
    userId: string,
    tenantId: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    return AuditServiceMock.logEvent({
      userId,
      tenantId,
      action,
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata
    });
  }
  
  /**
   * Log an authentication-related audit event
   */
  static async logAuthEvent(
    userId: string,
    tenantId: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    return AuditServiceMock.logEvent({
      userId,
      tenantId,
      action,
      resourceType: 'auth',
      resourceId: userId,
      metadata
    });
  }
  
  /**
   * Log a system-level audit event
   */
  static async logSystemEvent(
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    return AuditServiceMock.logEvent({
      userId: 'system',
      tenantId: 'system',
      action,
      resourceType: 'system',
      resourceId: 'system',
      metadata
    });
  }
}

export default AuditServiceMock;
