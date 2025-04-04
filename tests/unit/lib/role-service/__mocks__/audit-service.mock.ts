/**
 * Mock for AuditService
 */

export const mockLogEvent = jest.fn().mockResolvedValue({
  id: 'mock-audit-id',
  timestamp: new Date().toISOString()
});

export const mockAuditService = {
  logEvent: mockLogEvent,
  logPermissionEvent: jest.fn(),
  logAuthEvent: jest.fn(),
  logRoleEvent: jest.fn(),
  logTenantMembershipEvent: jest.fn(),
  logCrossTenantAccessAttempt: jest.fn(),
  getEventById: jest.fn(),
  queryEvents: jest.fn(),
  getRecentEvents: jest.fn(),
  pruneOldEvents: jest.fn()
};

// Mock the AuditService module
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: mockAuditService,
  __esModule: true,
  default: mockAuditService
}));
