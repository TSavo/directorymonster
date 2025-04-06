import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies first
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn().mockImplementation((body, init) => ({
        body,
        init,
        status: init?.status || 200
      }))
    }
  };
});

jest.mock('../../../src/lib/audit/audit-service', () => {
  return {
    AuditService: {
      logSecurityEvent: jest.fn().mockResolvedValue(undefined),
      logCrossTenantAccessAttempt: jest.fn().mockResolvedValue(undefined),
      logCrossSiteAccessAttempt: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Now import the modules
import { secureTenantSiteContext } from '../../../src/app/api/middleware/secureTenantSiteContext';
import { AuditAction } from '../../../src/lib/audit/types';



describe('secureTenantSiteContext Middleware', () => {
  const testTenantId = 'tenant-123';
  const testSiteId = 'site-123';
  const testUserId = 'user-123';
  const testRequestId = 'req-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access when tenant and site context match URL parameters', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test?tenantId=tenant-123&siteId=site-123', {
      headers: {
        'x-tenant-id': testTenantId,
        'x-site-id': testSiteId,
        'x-user-id': testUserId,
        'x-request-id': testRequestId
      }
    });

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

    // Act
    await secureTenantSiteContext(req, mockHandler);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(req);
    // No audit logs should be created
    const { AuditService } = require('../../../src/lib/audit/audit-service');
    expect(AuditService.logSecurityEvent).not.toHaveBeenCalled();
    expect(AuditService.logCrossTenantAccessAttempt).not.toHaveBeenCalled();
    expect(AuditService.logCrossSiteAccessAttempt).not.toHaveBeenCalled();
  });

  it('should block cross-tenant access attempts', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test?tenantId=tenant-456', {
      headers: {
        'x-tenant-id': testTenantId,
        'x-site-id': testSiteId,
        'x-user-id': testUserId,
        'x-request-id': testRequestId
      }
    });

    const mockHandler = jest.fn();

    // Act
    const response = await secureTenantSiteContext(req, mockHandler);

    // Assert
    expect(mockHandler).not.toHaveBeenCalled();
    const { AuditService } = require('../../../src/lib/audit/audit-service');
    expect(AuditService.logCrossTenantAccessAttempt).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'tenant-456',
      expect.objectContaining({
        requestId: testRequestId,
        method: 'GET',
        url: expect.stringContaining('tenant-456')
      })
    );
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Cross-tenant access denied'
      }),
      { status: 403 }
    );
  });

  it('should block cross-site access attempts', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test?siteId=site-456', {
      headers: {
        'x-tenant-id': testTenantId,
        'x-site-id': testSiteId,
        'x-user-id': testUserId,
        'x-request-id': testRequestId
      }
    });

    const mockHandler = jest.fn();

    // Act
    const response = await secureTenantSiteContext(req, mockHandler);

    // Assert
    expect(mockHandler).not.toHaveBeenCalled();
    const { AuditService } = require('../../../src/lib/audit/audit-service');
    expect(AuditService.logCrossSiteAccessAttempt).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      testSiteId,
      'site-456',
      expect.objectContaining({
        requestId: testRequestId,
        method: 'GET',
        url: expect.stringContaining('site-456')
      })
    );
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Cross-site access denied'
      }),
      { status: 403 }
    );
  });

  it('should allow access when no URL parameters are provided', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test', {
      headers: {
        'x-tenant-id': testTenantId,
        'x-site-id': testSiteId,
        'x-user-id': testUserId,
        'x-request-id': testRequestId
      }
    });

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

    // Act
    await secureTenantSiteContext(req, mockHandler);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(req);
    // No audit logs should be created
    const { AuditService } = require('../../../src/lib/audit/audit-service');
    expect(AuditService.logSecurityEvent).not.toHaveBeenCalled();
    expect(AuditService.logCrossTenantAccessAttempt).not.toHaveBeenCalled();
    expect(AuditService.logCrossSiteAccessAttempt).not.toHaveBeenCalled();
  });
});
