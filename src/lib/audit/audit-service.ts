import { v4 as uuidv4 } from 'uuid';
import {
  AuditEvent,
  AuditEventInput,
  AuditEventQuery,
  AuditAction,
  AuditSeverity,
  DEFAULT_SEVERITY_MAP
} from './types';
import redis from '@/lib/redis';
import { ResourceType } from '@/components/admin/auth/utils/accessControl';

/**
 * Service for managing audit events
 * Implements the audit trail requirements from section 3 of Security Considerations in MULTI_TENANT_ACL_SPEC.md
 */
export class AuditService {
  private static AUDIT_EVENT_PREFIX = 'audit:event:';
  private static AUDIT_INDEX_PREFIX = 'audit:index:';
  private static AUDIT_TENANT_PREFIX = 'audit:tenant:';
  private static AUDIT_USER_PREFIX = 'audit:user:';
  private static AUDIT_ACTION_PREFIX = 'audit:action:';
  private static AUDIT_RESOURCE_PREFIX = 'audit:resource:';
  private static GLOBAL_TENANT_ID = 'global'; // Special tenant ID for system-wide events

  /**
   * Create a new audit event
   *
   * @param event Audit event details to log
   * @returns The created audit event
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

      // Store the audit event
      const key = AuditService.AUDIT_EVENT_PREFIX + id;
      await redis.set(key, JSON.stringify(auditEvent));

      // Index by tenant
      const tenantKey = `${AuditService.AUDIT_TENANT_PREFIX}${event.tenantId}`;
      await redis.zadd(tenantKey, new Date(timestamp).getTime(), id);

      // Index by user
      const userKey = `${AuditService.AUDIT_USER_PREFIX}${event.userId}`;
      await redis.zadd(userKey, new Date(timestamp).getTime(), id);

      // Index by action
      const actionKey = `${AuditService.AUDIT_ACTION_PREFIX}${event.action}`;
      await redis.zadd(actionKey, new Date(timestamp).getTime(), id);

      // Index by resource type and ID if provided
      if (event.resourceType) {
        const resourceTypeKey = `${AuditService.AUDIT_RESOURCE_PREFIX}${event.resourceType}`;
        await redis.zadd(resourceTypeKey, new Date(timestamp).getTime(), id);

        if (event.resourceId) {
          const resourceIdKey = `${AuditService.AUDIT_RESOURCE_PREFIX}${event.resourceType}:${event.resourceId}`;
          await redis.zadd(resourceIdKey, new Date(timestamp).getTime(), id);
        }
      }

      // Add to global index for cross-tenant viewing by global admins
      const globalIndexKey = `${AuditService.AUDIT_INDEX_PREFIX}all`;
      await redis.zadd(globalIndexKey, new Date(timestamp).getTime(), id);

      return auditEvent;
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't block the application flow for audit failures
      // But re-throw in development to catch issues
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }

      // Return a minimal version of the event for production
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
   *
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param resourceType Resource type
   * @param permission Permission being checked
   * @param resourceId Optional resource ID
   * @param success Whether the permission check succeeded
   * @param details Additional details
   * @returns The created audit event
   */
  public static async logPermissionEvent(
    userId: string,
    tenantId: string,
    resourceType: ResourceType,
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
   *
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param success Whether authentication succeeded
   * @param details Additional details
   * @returns The created audit event
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
   *
   * @param userId User ID performing the action
   * @param tenantId Tenant ID
   * @param action Role action (created, updated, deleted)
   * @param roleId Role ID
   * @param details Additional details
   * @returns The created audit event
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
   *
   * @param adminUserId User ID performing the action
   * @param tenantId Tenant ID
   * @param targetUserId User ID being added/removed
   * @param action Membership action (added or removed)
   * @param details Additional details
   * @returns The created audit event
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
   *
   * @param userId User ID attempting access
   * @param sourceTenantId Source tenant ID
   * @param targetTenantId Target tenant ID
   * @param details Additional details
   * @returns The created audit event
   */
  public static async logCrossTenantAccessAttempt(
    userId: string,
    sourceTenantId: string,
    targetTenantId: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return AuditService.logEvent({
      userId,
      tenantId: sourceTenantId, // Log in the source tenant
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
   *
   * @param userId User ID attempting access
   * @param tenantId Tenant ID
   * @param sourceSiteId Source site ID
   * @param targetSiteId Target site ID
   * @param details Additional details
   * @returns The created audit event
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
   *
   * @param id Audit event ID
   * @param tenantId Optional tenant ID for access control
   * @returns The audit event or null if not found or not accessible
   */
  public static async getEventById(id: string, tenantId?: string): Promise<AuditEvent | null> {
    try {
      const key = AuditService.AUDIT_EVENT_PREFIX + id;
      const eventJson = await redis.get(key);

      if (!eventJson) {
        return null;
      }

      const event = JSON.parse(eventJson) as AuditEvent;

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
   *
   * @param query Query parameters
   * @param userTenantContext Tenant context of the requesting user (for security)
   * @param isGlobalAdmin Whether the user is a global admin
   * @returns Filtered audit events
   */
  public static async queryEvents(
    query: AuditEventQuery,
    userTenantContext: string,
    isGlobalAdmin: boolean = false
  ): Promise<AuditEvent[]> {
    try {
      // Enforce tenant isolation unless user is a global admin
      const tenantId = isGlobalAdmin ? (query.tenantId || 'all') : userTenantContext;

      // Determine which index to use based on the most specific filter
      let indexKey: string;
      let eventIds: string[] = [];

      // Default time range
      const startTime = query.startDate
        ? new Date(query.startDate).getTime()
        : 0;

      const endTime = query.endDate
        ? new Date(query.endDate).getTime()
        : '+inf';

      // Apply safe limits to prevent unbounded queries
      const limit = Math.min(query.limit || 50, 1000); // Maximum 1000 results
      const offset = Math.max(query.offset || 0, 0); // Non-negative offset

      // If filtering by specific resource ID, use resource index
      if (query.resourceType && query.resourceId) {
        indexKey = `${AuditService.AUDIT_RESOURCE_PREFIX}${query.resourceType}:${query.resourceId}`;
      }
      // If filtering by resource type only, use resource type index
      else if (query.resourceType) {
        indexKey = `${AuditService.AUDIT_RESOURCE_PREFIX}${query.resourceType}`;
      }
      // If filtering by specific action, use action index
      else if (query.action && !Array.isArray(query.action)) {
        indexKey = `${AuditService.AUDIT_ACTION_PREFIX}${query.action}`;
      }
      // If filtering by user, use user index
      else if (query.userId) {
        indexKey = `${AuditService.AUDIT_USER_PREFIX}${query.userId}`;
      }
      // Otherwise, use tenant index
      else {
        indexKey = tenantId === 'all'
          ? `${AuditService.AUDIT_INDEX_PREFIX}all`
          : `${AuditService.AUDIT_TENANT_PREFIX}${tenantId}`;
      }

      // Get IDs from the index
      eventIds = await redis.zrangebyscore(
        indexKey,
        startTime,
        endTime,
        'LIMIT',
        offset,
        limit
      );

      if (!eventIds.length) {
        return [];
      }

      // Fetch all events
      const eventPromises = eventIds.map(id => AuditService.getEventById(id, isGlobalAdmin ? undefined : userTenantContext));
      const events = await Promise.all(eventPromises);

      // Filter out nulls
      const validEvents = events.filter(e => e !== null) as AuditEvent[];

      // Apply additional filters
      return validEvents.filter(event => {
        // Always enforce tenant isolation unless global admin
        if (!isGlobalAdmin && event.tenantId !== userTenantContext) {
          return false;
        }

        // Filter by action (if array of actions)
        if (query.action && Array.isArray(query.action) && !query.action.includes(event.action)) {
          return false;
        }

        // Filter by severity (if array of severities)
        if (query.severity && Array.isArray(query.severity) && !query.severity.includes(event.severity)) {
          return false;
        }

        // Filter by single severity
        if (query.severity && !Array.isArray(query.severity) && event.severity !== query.severity) {
          return false;
        }

        // Filter by success status
        if (query.success !== undefined && event.success !== query.success) {
          return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Error querying audit events:', error);
      // Don't expose errors to the client in production
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
      return [];
    }
  }

  /**
   * Get recent audit events for a specific tenant
   *
   * @param tenantId Tenant ID
   * @param limit Maximum number of events to return
   * @param offset Offset for pagination
   * @returns Recent audit events
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
   *
   * @param retentionDays Number of days to retain audit logs
   * @returns Number of events deleted
   */
  public static async pruneOldEvents(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

      // Get all events older than the cutoff from the global index
      const globalIndexKey = `${AuditService.AUDIT_INDEX_PREFIX}all`;
      const oldEventIds = await redis.zrangebyscore(globalIndexKey, 0, cutoffTime);

      if (!oldEventIds.length) {
        return 0;
      }

      // Get all events to find their tenant IDs
      const eventsToDelete = await Promise.all(
        oldEventIds.map(id => AuditService.getEventById(id))
      );

      // Delete each event and its indexes
      const deletePromises = eventsToDelete.filter(e => e !== null).map(async event => {
        try {
          const id = event!.id;
          const timestamp = new Date(event!.timestamp).getTime();

          // Remove from all indexes
          await redis.zrem(`${AuditService.AUDIT_TENANT_PREFIX}${event!.tenantId}`, id);
          await redis.zrem(`${AuditService.AUDIT_USER_PREFIX}${event!.userId}`, id);
          await redis.zrem(`${AuditService.AUDIT_ACTION_PREFIX}${event!.action}`, id);
          await redis.zrem(globalIndexKey, id);

          // Remove from resource indexes if applicable
          if (event!.resourceType) {
            await redis.zrem(`${AuditService.AUDIT_RESOURCE_PREFIX}${event!.resourceType}`, id);

            if (event!.resourceId) {
              await redis.zrem(
                `${AuditService.AUDIT_RESOURCE_PREFIX}${event!.resourceType}:${event!.resourceId}`,
                id
              );
            }
          }

          // Delete the event itself
          await redis.del(`${AuditService.AUDIT_EVENT_PREFIX}${id}`);

          return true;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(deletePromises);
      return results.filter(success => success).length;
    } catch (error) {
      console.error('Error pruning old audit events:', error);
      return 0;
    }
  }
}

export default AuditService;
