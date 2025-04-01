import { AuditService } from '../audit-service';
import { AuditAction, AuditSeverity } from '../types';
import redis from '@/lib/redis';

// Mock the redis client
jest.mock('@/lib/redis', () => ({
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  zadd: jest.fn().mockResolvedValue(1),
  zrangebyscore: jest.fn(),
  zrem: jest.fn().mockResolvedValue(1),
  del: jest.fn().mockResolvedValue(1),
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should create an audit event with all required fields', async () => {
      const eventInput = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        action: AuditAction.ACCESS_GRANTED,
        resourceType: 'user',
        resourceId: 'user-789',
        details: { permission: 'read' },
        success: true
      };

      const event = await AuditService.logEvent(eventInput);

      // Check that the event has all the required fields
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.userId).toBe(eventInput.userId);
      expect(event.tenantId).toBe(eventInput.tenantId);
      expect(event.action).toBe(eventInput.action);
      expect(event.resourceType).toBe(eventInput.resourceType);
      expect(event.resourceId).toBe(eventInput.resourceId);
      expect(event.details).toEqual(eventInput.details);
      expect(event.success).toBe(eventInput.success);

      // Check that Redis set was called
      expect(redis.set).toHaveBeenCalled();

      // Check that all indexes were created
      expect(redis.zadd).toHaveBeenCalledTimes(6); // tenant, user, action, resourceType, resourceId, global indexes
    });

    it('should use default severity if not provided', async () => {
      const eventInput = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        action: AuditAction.ACCESS_DENIED,
        details: { permission: 'read' },
        success: false
      };

      const event = await AuditService.logEvent(eventInput);

      // Should have severity from the default map for ACCESS_DENIED
      expect(event.severity).toBe(AuditSeverity.WARNING);
    });

    it('should handle errors gracefully in production', async () => {
      // Save original env
      const originalEnv = process.env.NODE_ENV;
      
      // Set to production
      process.env.NODE_ENV = 'production';
      
      // Make Redis throw an error
      (redis.set as jest.Mock).mockRejectedValueOnce(new Error('Redis connection failed'));

      const eventInput = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        action: AuditAction.ACCESS_GRANTED,
        details: { permission: 'read' },
        success: true
      };

      // Should not throw, but return minimal event
      const event = await AuditService.logEvent(eventInput);
      
      expect(event.id).toBe('error');
      expect(event.details.error).toBeDefined();
      
      // Restore env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logPermissionEvent', () => {
    it('should log successful permission checks', async () => {
      await AuditService.logPermissionEvent(
        'user-123',
        'tenant-456',
        'user',
        'read',
        true,
        'user-789',
        { method: 'GET', path: '/api/users/789' }
      );

      // Should have called logEvent with the right parameters
      expect(redis.set).toHaveBeenCalled();
      expect(redis.zadd).toHaveBeenCalled();
    });

    it('should log failed permission checks', async () => {
      await AuditService.logPermissionEvent(
        'user-123',
        'tenant-456',
        'user',
        'write',
        false,
        'user-789',
        { method: 'POST', path: '/api/users/789' }
      );

      // Should have called logEvent with the right parameters
      expect(redis.set).toHaveBeenCalled();
      expect(redis.zadd).toHaveBeenCalled();
    });
  });

  describe('queryEvents', () => {
    beforeEach(() => {
      // Mock behavior for getEventById
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === 'audit:event:event-1') {
          return JSON.stringify({
            id: 'event-1',
            timestamp: '2023-01-01T12:00:00Z',
            userId: 'user-123',
            tenantId: 'tenant-456',
            action: AuditAction.ACCESS_GRANTED,
            severity: AuditSeverity.INFO,
            resourceType: 'user',
            resourceId: 'user-789',
            details: { permission: 'read' },
            success: true
          });
        }
        if (key === 'audit:event:event-2') {
          return JSON.stringify({
            id: 'event-2',
            timestamp: '2023-01-02T12:00:00Z',
            userId: 'user-123',
            tenantId: 'tenant-456',
            action: AuditAction.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            resourceType: 'category',
            resourceId: 'category-789',
            details: { permission: 'write' },
            success: false
          });
        }
        return null;
      });

      // Mock behavior for zrangebyscore
      (redis.zrangebyscore as jest.Mock).mockResolvedValue(['event-1', 'event-2']);
    });

    it('should query events with basic filters', async () => {
      const events = await AuditService.queryEvents(
        {
          tenantId: 'tenant-456',
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-01-03T00:00:00Z',
          limit: 10
        },
        'tenant-456',
        false
      );

      // Should return both events
      expect(events.length).toBe(2);
      expect(events[0].id).toBe('event-1');
      expect(events[1].id).toBe('event-2');

      // Should have called zrangebyscore to get IDs
      expect(redis.zrangebyscore).toHaveBeenCalled();

      // Should have called get twice to fetch events
      expect(redis.get).toHaveBeenCalledTimes(2);
    });

    it('should enforce tenant isolation for non-admin users', async () => {
      // Mock zrangebyscore to return events from different tenants
      (redis.zrangebyscore as jest.Mock).mockResolvedValueOnce(['event-1', 'event-2']);
      
      // Override get for event-2 to be from a different tenant
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === 'audit:event:event-1') {
          return JSON.stringify({
            id: 'event-1',
            timestamp: '2023-01-01T12:00:00Z',
            userId: 'user-123',
            tenantId: 'tenant-456',
            action: AuditAction.ACCESS_GRANTED,
            severity: AuditSeverity.INFO,
            details: { permission: 'read' },
            success: true
          });
        }
        if (key === 'audit:event:event-2') {
          return JSON.stringify({
            id: 'event-2',
            timestamp: '2023-01-02T12:00:00Z',
            userId: 'user-123',
            tenantId: 'different-tenant',
            action: AuditAction.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            details: { permission: 'write' },
            success: false
          });
        }
        return null;
      });

      const events = await AuditService.queryEvents(
        {
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-01-03T00:00:00Z'
        },
        'tenant-456',
        false // Not a global admin
      );

      // Should only return events from the user's tenant
      expect(events.length).toBe(1);
      expect(events[0].id).toBe('event-1');
      expect(events[0].tenantId).toBe('tenant-456');
    });

    it('should allow global admins to see cross-tenant events', async () => {
      // Mock zrangebyscore to return events from different tenants
      (redis.zrangebyscore as jest.Mock).mockResolvedValueOnce(['event-1', 'event-2']);
      
      // Override get for event-2 to be from a different tenant
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === 'audit:event:event-1') {
          return JSON.stringify({
            id: 'event-1',
            timestamp: '2023-01-01T12:00:00Z',
            userId: 'user-123',
            tenantId: 'tenant-456',
            action: AuditAction.ACCESS_GRANTED,
            severity: AuditSeverity.INFO,
            details: { permission: 'read' },
            success: true
          });
        }
        if (key === 'audit:event:event-2') {
          return JSON.stringify({
            id: 'event-2',
            timestamp: '2023-01-02T12:00:00Z',
            userId: 'user-123',
            tenantId: 'different-tenant',
            action: AuditAction.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            details: { permission: 'write' },
            success: false
          });
        }
        return null;
      });

      const events = await AuditService.queryEvents(
        {
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-01-03T00:00:00Z'
        },
        'tenant-456',
        true // Global admin
      );

      // Should return events from all tenants
      expect(events.length).toBe(2);
      expect(events[0].id).toBe('event-1');
      expect(events[1].id).toBe('event-2');
      expect(events[0].tenantId).toBe('tenant-456');
      expect(events[1].tenantId).toBe('different-tenant');
    });

    it('should filter events by action', async () => {
      const events = await AuditService.queryEvents(
        {
          action: AuditAction.ACCESS_GRANTED,
          tenantId: 'tenant-456'
        },
        'tenant-456',
        false
      );

      // Should have called zrangebyscore with action index
      expect(redis.zrangebyscore).toHaveBeenCalledWith(
        expect.stringContaining('audit:action:access_granted'),
        expect.any(Number),
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('getRecentEvents', () => {
    it('should retrieve recent events for a tenant', async () => {
      // Mock queryEvents
      const mockEvents = [
        {
          id: 'event-1',
          timestamp: '2023-01-01T12:00:00Z',
          userId: 'user-123',
          tenantId: 'tenant-456',
          action: AuditAction.ACCESS_GRANTED,
          severity: AuditSeverity.INFO,
          details: { permission: 'read' },
          success: true
        }
      ];
      
      // Mock the implementation of queryEvents
      jest.spyOn(AuditService, 'queryEvents').mockResolvedValueOnce(mockEvents as any);

      const events = await AuditService.getRecentEvents('tenant-456', 10, 0);

      // Should have called queryEvents with the right parameters
      expect(AuditService.queryEvents).toHaveBeenCalledWith(
        {
          tenantId: 'tenant-456',
          limit: 10,
          offset: 0
        },
        'tenant-456',
        true
      );

      // Should return the mock events
      expect(events).toEqual(mockEvents);
    });
  });

  describe('pruneOldEvents', () => {
    it('should delete events older than the retention period', async () => {
      // Mock zrangebyscore to return old event IDs
      (redis.zrangebyscore as jest.Mock).mockResolvedValueOnce(['old-event-1', 'old-event-2']);
      
      // Mock get to return event data
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === 'audit:event:old-event-1') {
          return JSON.stringify({
            id: 'old-event-1',
            timestamp: '2022-01-01T12:00:00Z',
            userId: 'user-123',
            tenantId: 'tenant-456',
            action: AuditAction.ACCESS_GRANTED,
            severity: AuditSeverity.INFO,
            resourceType: 'user',
            details: { permission: 'read' },
            success: true
          });
        }
        if (key === 'audit:event:old-event-2') {
          return JSON.stringify({
            id: 'old-event-2',
            timestamp: '2022-01-02T12:00:00Z',
            userId: 'user-456',
            tenantId: 'tenant-789',
            action: AuditAction.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            resourceType: 'category',
            resourceId: 'category-123',
            details: { permission: 'write' },
            success: false
          });
        }
        return null;
      });

      const deletedCount = await AuditService.pruneOldEvents(90);

      // Should have called zrangebyscore to get old event IDs
      expect(redis.zrangebyscore).toHaveBeenCalled();

      // Should have called get twice to fetch event data
      expect(redis.get).toHaveBeenCalledTimes(2);

      // Should have called zrem to remove from indexes and del to delete events
      expect(redis.zrem).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();

      // Should return the number of events deleted
      expect(deletedCount).toBe(2);
    });

    it('should handle no events to delete', async () => {
      // Mock zrangebyscore to return no events
      (redis.zrangebyscore as jest.Mock).mockResolvedValueOnce([]);

      const deletedCount = await AuditService.pruneOldEvents(90);

      // Should have called zrangebyscore
      expect(redis.zrangebyscore).toHaveBeenCalled();

      // Should not have called get, zrem, or del
      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.zrem).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();

      // Should return 0
      expect(deletedCount).toBe(0);
    });
  });
});
