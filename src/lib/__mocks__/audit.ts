/**
 * Manual mock for AuditService
 */

export const AuditService = {
  logSecurityEvent: jest.fn().mockResolvedValue(true),
  logAuditEvent: jest.fn().mockResolvedValue(true),
  getAuditEvents: jest.fn().mockResolvedValue([])
};

export default AuditService;
