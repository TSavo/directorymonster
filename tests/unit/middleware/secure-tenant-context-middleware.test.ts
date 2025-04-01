/**
 * Tests for withSecureTenantContext middleware
 */
import { TenantContext, withSecureTenantContext } from '@/app/api/middleware/secureTenantContext';
import { validateUuid } from 'uuid';
import AuditService from '@/lib/audit/audit-service';
import { AuditAction } from '@/lib/audit/types';
import {
  VALID_TENANT_ID,
  DIFFERENT_TENANT_ID,
  USER_ID,
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockRequest,
  createHandlerMock,
  mockSearchParams,
  mockURL,
  pathSegments
} from './secure-tenant-setup';

describe('WithSecureTenantContext Middleware', () => {
  beforeAll(() => {
    setupTestEnvironment();
  });
  
  afterAll(() => {
    teardownTestEnvironment();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.get.mockImplementation(() => null);
  });
  
  it('should call handler with context on successful validation', async () => {
    // Arrange
    const mockReq = createMockRequest();
    const handlerMock = createHandlerMock();
    
    // Mock TenantContext.fromRequest to return a valid context
    jest.spyOn(TenantContext, 'fromRequest').mockResolvedValueOnce(
      new TenantContext(VALID_TENANT_ID, USER_ID)
    );
    
    // Act
    await withSecureTenantContext(mockReq, handlerMock);
    
    // Assert
    expect(handlerMock).toHaveBeenCalled();
    // Manual verification of handler params since we can't match the exact TenantContext instance
    expect(handlerMock.mock.calls[0][0]).toBe(mockReq);
    expect(handlerMock.mock.calls[0][1].tenantId).toBe(VALID_TENANT_ID);
    expect(handlerMock.mock.calls[0][1].userId).toBe(USER_ID);
  });
  
  it('should return 401 when context creation fails', async () => {
    // Arrange
    const mockReq = createMockRequest();
    const handlerMock = createHandlerMock();
    
    // Mock TenantContext.fromRequest to return null
    jest.spyOn(TenantContext, 'fromRequest').mockResolvedValueOnce(null);
    
    // Act
    const response = await withSecureTenantContext(mockReq, handlerMock);
    
    // Assert
    expect(handlerMock).not.toHaveBeenCalled();
    expect(response).toHaveProperty('status', 401);
    expect(response.body).toEqual(expect.objectContaining({
      error: 'Unauthorized',
      message: 'Invalid tenant context'
    }));
  });
  
  it('should return 403 when tenant ID mismatch in URL', async () => {
    // Arrange
    const mockReq = createMockRequest();
    const handlerMock = createHandlerMock();
    
    // Mock TenantContext.fromRequest to return a valid context
    jest.spyOn(TenantContext, 'fromRequest').mockResolvedValueOnce(
      new TenantContext(VALID_TENANT_ID, USER_ID)
    );
    
    // Set up URL mock to return a different tenant ID
    mockSearchParams.get.mockImplementation((param) => {
      if (param === 'tenantId') return DIFFERENT_TENANT_ID;
      return null;
    });
    
    // Set up AuditService mock
    (AuditService.logSecurityEvent as jest.Mock).mockResolvedValueOnce(undefined);
    
    // Act
    const response = await withSecureTenantContext(mockReq, handlerMock);
    
    // Assert
    expect(handlerMock).not.toHaveBeenCalled();
    expect(response).toHaveProperty('status', 403);
    expect(response.body).toEqual(expect.objectContaining({
      error: 'Cross-tenant access denied'
    }));
    expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
      USER_ID,
      VALID_TENANT_ID,
      AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
      expect.objectContaining({
        targetTenantId: DIFFERENT_TENANT_ID
      })
    );
  });
  
  it('should detect suspicious UUID in path segments', async () => {
    // Arrange
    const mockReq = createMockRequest();
    const handlerMock = createHandlerMock();
    
    // Mock TenantContext.fromRequest to return a valid context
    jest.spyOn(TenantContext, 'fromRequest').mockResolvedValueOnce(
      new TenantContext(VALID_TENANT_ID, USER_ID)
    );
    
    // Update path segments to include a different tenant ID
    pathSegments.push(DIFFERENT_TENANT_ID);
    
    // Update mockURL to use the suspicious path
    mockURL.pathname = `/api/tenants/${VALID_TENANT_ID}/resources/${DIFFERENT_TENANT_ID}`;
    
    // Mock validateUuid to validate both tenant IDs
    (validateUuid as jest.Mock).mockImplementation((id) => {
      return id === VALID_TENANT_ID || id === DIFFERENT_TENANT_ID;
    });
    
    // Set up AuditService mock
    (AuditService.logSecurityEvent as jest.Mock).mockResolvedValueOnce(undefined);
    
    // Act
    const response = await withSecureTenantContext(mockReq, handlerMock);
    
    // Assert
    expect(handlerMock).not.toHaveBeenCalled();
    expect(response).toHaveProperty('status', 403);
    expect(response.body).toEqual(expect.objectContaining({
      error: 'Cross-tenant access denied'
    }));
    expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
      USER_ID,
      VALID_TENANT_ID,
      AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
      expect.objectContaining({
        suspiciousPathSegment: DIFFERENT_TENANT_ID
      })
    );
    
    // Clean up - remove the added path segment
    pathSegments.pop();
  });
  
  it('should handle errors in the middleware', async () => {
    // Arrange
    const mockReq = createMockRequest();
    const handlerMock = createHandlerMock();
    
    // Mock TenantContext.fromRequest to throw an error
    jest.spyOn(TenantContext, 'fromRequest').mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    // Act
    const response = await withSecureTenantContext(mockReq, handlerMock);
    
    // Assert
    expect(handlerMock).not.toHaveBeenCalled();
    expect(response).toHaveProperty('status', 500);
    expect(response.body).toEqual(expect.objectContaining({
      error: 'Internal Server Error'
    }));
  });
});
