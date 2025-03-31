import { ResourceType } from '@/components/admin/auth/utils/accessControl';

/**
 * Enum of possible audit action types
 */
export enum AuditAction {
  // Permission-related actions
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  
  // Role management actions
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  
  // Role assignment actions
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',
  
  // Tenant membership actions
  USER_ADDED_TO_TENANT = 'user_added_to_tenant',
  USER_REMOVED_FROM_TENANT = 'user_removed_from_tenant',
  
  // Tenant management actions
  TENANT_CREATED = 'tenant_created',
  TENANT_UPDATED = 'tenant_updated',
  TENANT_DELETED = 'tenant_deleted',
  
  // Cross-tenant actions
  CROSS_TENANT_ACCESS_ATTEMPT = 'cross_tenant_access_attempt',
  
  // User actions
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PASSWORD_CHANGED = 'user_password_changed',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  
  // Other security events
  SETTINGS_CHANGED = 'settings_changed',
  CONFIG_UPDATED = 'config_updated'
}

/**
 * Severity level of audit events
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Comprehensive audit event interface
 * Based on section 3 of Security Considerations in MULTI_TENANT_ACL_SPEC.md
 */
export interface AuditEvent {
  id: string;                               // Unique identifier for the event
  timestamp: string;                        // ISO timestamp when the event occurred
  userId: string;                           // User who performed the action
  tenantId: string;                         // Tenant context where the action occurred
  action: AuditAction;                      // Type of action performed
  severity: AuditSeverity;                  // Severity level of the event
  resourceType?: ResourceType;              // Type of resource being accessed
  resourceId?: string;                      // Specific resource ID (if applicable)
  ipAddress?: string;                       // IP address of the request
  userAgent?: string;                       // User agent of the request
  details: Record<string, any>;             // Additional details about the event
  success: boolean;                         // Whether the action succeeded
}

/**
 * Input for creating a new audit event
 * Omits fields that will be generated automatically
 */
export type AuditEventInput = Omit<AuditEvent, 'id' | 'timestamp'>;

/**
 * Query parameters for filtering audit events
 */
export interface AuditEventQuery {
  tenantId?: string;                        // Filter by tenant
  userId?: string;                          // Filter by user
  action?: AuditAction | AuditAction[];     // Filter by action type(s)
  resourceType?: ResourceType;              // Filter by resource type
  resourceId?: string;                      // Filter by resource ID
  startDate?: string;                       // Start of date range (ISO timestamp)
  endDate?: string;                         // End of date range (ISO timestamp)
  severity?: AuditSeverity | AuditSeverity[]; // Filter by severity level(s)
  limit?: number;                           // Limit number of results
  offset?: number;                          // Offset for pagination
  success?: boolean;                        // Filter by success status
}

/**
 * Map of audit actions to default severity levels
 */
export const DEFAULT_SEVERITY_MAP: Record<AuditAction, AuditSeverity> = {
  [AuditAction.ACCESS_GRANTED]: AuditSeverity.INFO,
  [AuditAction.ACCESS_DENIED]: AuditSeverity.WARNING,
  [AuditAction.ROLE_CREATED]: AuditSeverity.INFO,
  [AuditAction.ROLE_UPDATED]: AuditSeverity.INFO,
  [AuditAction.ROLE_DELETED]: AuditSeverity.WARNING,
  [AuditAction.ROLE_ASSIGNED]: AuditSeverity.INFO,
  [AuditAction.ROLE_REMOVED]: AuditSeverity.INFO,
  [AuditAction.USER_ADDED_TO_TENANT]: AuditSeverity.INFO,
  [AuditAction.USER_REMOVED_FROM_TENANT]: AuditSeverity.INFO,
  [AuditAction.TENANT_CREATED]: AuditSeverity.INFO,
  [AuditAction.TENANT_UPDATED]: AuditSeverity.INFO,
  [AuditAction.TENANT_DELETED]: AuditSeverity.CRITICAL,
  [AuditAction.CROSS_TENANT_ACCESS_ATTEMPT]: AuditSeverity.ERROR,
  [AuditAction.USER_LOGIN]: AuditSeverity.INFO,
  [AuditAction.USER_LOGOUT]: AuditSeverity.INFO,
  [AuditAction.USER_PASSWORD_CHANGED]: AuditSeverity.INFO,
  [AuditAction.USER_CREATED]: AuditSeverity.INFO,
  [AuditAction.USER_UPDATED]: AuditSeverity.INFO,
  [AuditAction.USER_DELETED]: AuditSeverity.WARNING,
  [AuditAction.SETTINGS_CHANGED]: AuditSeverity.INFO,
  [AuditAction.CONFIG_UPDATED]: AuditSeverity.INFO
};
