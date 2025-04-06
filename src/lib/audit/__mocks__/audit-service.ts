/**
 * Mock Audit Service for testing
 */
import { v4 as uuidv4 } from 'uuid';
import {
  AuditEvent,
  AuditEventInput,
  AuditEventQuery,
  AuditAction,
  AuditSeverity,
  DEFAULT_SEVERITY_MAP
} from '../types';

// Store events in memory for testing
const auditEvents: AuditEvent[] = [];

export class AuditService {
  private static GLOBAL_TENANT_ID = 'global';

  /**
   * Create a new audit event
   */
  public static async logEvent(event: AuditEventInput): Promise<AuditEvent> {
    try {
      // Generate ID and timestamp
      const id = uuidv4();
      const timestamp = new Date().toISOString();

      // Set default severity if not provided
      const severity = event.severity ||
        (event.action in DEFAULT_SEVERITY_MAP ? DEFAULT_SEVERITY_MAP[event.action] : AuditSeverity.INFO);

      // Create the complete audit event
      const auditEvent: AuditEvent = {
        ...event,
        id,
        timestamp,
        severity
      };

      // Store the audit event in memory
      auditEvents.push(auditEvent);

      return auditEvent;
    } catch (error) {
      console.error('Error logging audit event:', error);

      // Return a minimal version of the event
      return {
        ...event,
        id: 'error',
        timestamp: new Date().toISOString(),
        severity: AuditSeverity.ERROR,
        details: { error: 'Failed to log audit event', ...event.details }
      };
    }
  }

  /**
   * Helper method to log permission-related events
   */
  public static async logPermissionEvent(
    userId: string,
    tenantId: string,
    resourceType: string,
    permission: string,
    success: boolean,
    resourceId?: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    const action = success ? AuditAction.ACCESS_GRANTED : AuditAction.ACCESS_DENIED;

    return AuditService.logEvent({
      userId,
      tenantId,
      action,
      resourceType,
      resourceId,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      details: {
        permission,
        ...details
      },
      success
    });
  }

  /**
   * Helper method to log user authentication events
   */
  public static async logAuthEvent(
    userId: string,
    tenantId: string,
    success: boolean,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return AuditService.logEvent({
      userId,
      tenantId,
      action: AuditAction.USER_LOGIN,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      details,
      success
    });
  }

  /**
   * Helper method to log role management events
   */
  public static async logRoleEvent(
    userId: string,
    tenantId: string,
    action: AuditAction.ROLE_CREATED | AuditAction.ROLE_UPDATED | AuditAction.ROLE_DELETED,
    roleId: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return AuditService.logEvent({
      userId,
      tenantId,
      action,
      resourceType: 'role',
      resourceId: roleId,
      details,
      success: true
    });
  }

  /**
   * Helper method to log tenant membership events
   */
  public static async logTenantMembershipEvent(
    adminUserId: string,
    tenantId: string,
    targetUserId: string,
    action: AuditAction.USER_ADDED_TO_TENANT | AuditAction.USER_REMOVED_FROM_TENANT,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return AuditService.logEvent({
      userId: adminUserId,
      tenantId,
      action,
      resourceType: 'user',
      resourceId: targetUserId,
      details: {
        targetUserId,
        ...details
      },
      success: true
    });
  }

  /**
   * Helper method to log cross-tenant access attempts
   */
  public static async logCrossTenantAccessAttempt(
    userId: string,
    sourceTenantId: string,
    targetTenantId: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return AuditService.logEvent({
      userId,
      tenantId: sourceTenantId,
      action: AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
      severity: AuditSeverity.ERROR,
      details: {
        targetTenantId,
        ...details
      },
      success: false
    });
  }

  /**
   * Helper method to log cross-site access attempts
   */
  public static async logCrossSiteAccessAttempt(
    userId: string,
    tenantId: string,
    sourceSiteId: string | null,
    targetSiteId: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return AuditService.logEvent({
      userId,
      tenantId,
      action: AuditAction.CROSS_SITE_ACCESS_ATTEMPT,
      severity: AuditSeverity.ERROR,
      details: {
        sourceSiteId,
        targetSiteId,
        ...details
      },
      success: false
    });
  }

  /**
   * Get an audit event by ID
   */
  public static async getEventById(id: string, tenantId?: string): Promise<AuditEvent | null> {
    try {
      const event = auditEvents.find(e => e.id === id);

      if (!event) {
        return null;
      }

      // If tenantId is provided, enforce tenant isolation
      if (tenantId && event.tenantId !== tenantId) {
        console.warn(`Tenant isolation violation: User from tenant ${tenantId} attempted to access event from tenant ${event.tenantId}`);
        return null;
      }

      return event;
    } catch (error) {
      console.error('Error retrieving audit event:', error);
      return null;
    }
  }

  /**
   * Query audit events with various filters
   */
  public static async queryEvents(
    query: AuditEventQuery,
    userTenantContext: string,
    isGlobalAdmin: boolean = false
  ): Promise<AuditEvent[]> {
    try {
      // Enforce tenant isolation unless user is a global admin
      const tenantId = isGlobalAdmin ? (query.tenantId || 'all') : userTenantContext;

      // Filter events
      return auditEvents.filter(event => {
        // Always enforce tenant isolation unless global admin
        if (!isGlobalAdmin && event.tenantId !== userTenantContext) {
          return false;
        }

        // Filter by tenant
        if (tenantId !== 'all' && event.tenantId !== tenantId) {
          return false;
        }

        // Filter by user
        if (query.userId && event.userId !== query.userId) {
          return false;
        }

        // Filter by resource type
        if (query.resourceType && event.resourceType !== query.resourceType) {
          return false;
        }

        // Filter by resource ID
        if (query.resourceId && event.resourceId !== query.resourceId) {
          return false;
        }

        // Filter by action (if string)
        if (query.action && !Array.isArray(query.action) && event.action !== query.action) {
          return false;
        }

        // Filter by action (if array)
        if (query.action && Array.isArray(query.action) && !query.action.includes(event.action)) {
          return false;
        }

        // Filter by severity (if string)
        if (query.severity && !Array.isArray(query.severity) && event.severity !== query.severity) {
          return false;
        }

        // Filter by severity (if array)
        if (query.severity && Array.isArray(query.severity) && !query.severity.includes(event.severity)) {
          return false;
        }

        // Filter by success
        if (query.success !== undefined && event.success !== query.success) {
          return false;
        }

        // Filter by date range
        if (query.startDate && new Date(event.timestamp) < new Date(query.startDate)) {
          return false;
        }

        if (query.endDate && new Date(event.timestamp) > new Date(query.endDate)) {
          return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Error querying audit events:', error);
      return [];
    }
  }

  /**
   * Get recent audit events for a specific tenant
   */
  public static async getRecentEvents(
    tenantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    // Apply safe limits
    const safeLimit = Math.min(limit, 1000);
    const safeOffset = Math.max(offset, 0);

    return AuditService.queryEvents(
      {
        tenantId,
        limit: safeLimit,
        offset: safeOffset
      },
      tenantId,
      true // Skip tenant isolation check
    );
  }

  /**
   * Delete audit events older than the retention period
   */
  public static async pruneOldEvents(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      const cutoffDate = new Date(cutoffTime);

      // Count events to delete
      const eventsToDelete = auditEvents.filter(event =>
        new Date(event.timestamp) < cutoffDate
      );

      // Remove events from the array
      for (const event of eventsToDelete) {
        const index = auditEvents.indexOf(event);
        if (index !== -1) {
          auditEvents.splice(index, 1);
        }
      }

      return eventsToDelete.length;
    } catch (error) {
      console.error('Error pruning old audit events:', error);
      return 0;
    }
  }

  /**
   * Clear all audit events (for testing)
   */
  public static clearEvents(): void {
    auditEvents.length = 0;
  }
}

export default AuditService;
