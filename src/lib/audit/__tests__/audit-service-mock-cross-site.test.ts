import { AuditService } from '../__mocks__/audit-service';
import { AuditAction, AuditSeverity } from '../types';

// Mock the AuditService to use the mock implementation
jest.mock('../audit-service');

describe('Mock AuditService Cross-Site Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have logCrossSiteAccessAttempt method', () => {
    // Check if the method exists
    expect(typeof AuditService.logCrossSiteAccessAttempt).toBe('function');
  });

  it('should log cross-site access attempts', async () => {
    // Spy on the logEvent method
    const logEventSpy = jest.spyOn(AuditService, 'logEvent');
    
    // Call the method
    await AuditService.logCrossSiteAccessAttempt(
      'user-123',
      'tenant-456',
      'site-789',
      'site-999',
      { requestId: 'req-123', method: 'GET', url: '/api/data' }
    );
    
    // Verify the logEvent method was called with the correct parameters
    expect(logEventSpy).toHaveBeenCalledWith({
      userId: 'user-123',
      tenantId: 'tenant-456',
      action: AuditAction.CROSS_SITE_ACCESS_ATTEMPT,
      severity: AuditSeverity.ERROR,
      details: {
        sourceSiteId: 'site-789',
        targetSiteId: 'site-999',
        requestId: 'req-123',
        method: 'GET',
        url: '/api/data'
      },
      success: false
    });
  });
});
