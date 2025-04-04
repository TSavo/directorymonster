/**
 * Direct mock for AuditService
 */

export const mockLogEvent = jest.fn();

// Mock the AuditService
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: mockLogEvent
  }
}));
