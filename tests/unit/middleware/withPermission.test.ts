import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/middleware/withPermission';
import { RoleService } from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

// Mock dependencies
jest.mock('@/lib/role-service', () => ({
  RoleService: {
    hasPermission: jest.fn(),
  }
}));

// Mock jsonwebtoken to control token verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((token) => {
    if (token === 'valid-token') {
      return { userId: 'user-123' };
    }
    throw new Error('Invalid token');
  }),
  JwtPayload: jest.fn()
}));

jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn((data, options) => ({ data, status: options?.status || 200 }))
    }
  };
});

describe('withPermission middleware', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock permission check
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
  });

  it('should call the handler when user has permission', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test', {
      headers: {
        'x-tenant-id': testTenantId,
        'authorization': 'Bearer valid-token'
      }
    });

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

    // Mock hasPermission to return true
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);

    // Act
    await withPermission(
      req,
      'setting' as ResourceType,
      'read' as Permission,
      mockHandler
    );

    // Assert
    expect(RoleService.hasPermission).toHaveBeenCalledWith(
      'user-123', // userId from the mocked JWT token
      testTenantId,
      'setting',
      'read',
      undefined
    );
    expect(mockHandler).toHaveBeenCalledWith(req);
  });

  it('should return 403 when user lacks permission', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test', {
      headers: {
        'x-tenant-id': testTenantId,
        'authorization': 'Bearer valid-token'
      }
    });

    // Mock permission check to fail
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);

    const mockHandler = jest.fn();

    // Act
    await withPermission(
      req,
      'setting' as ResourceType,
      'read' as Permission,
      mockHandler
    );

    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Permission denied'
      }),
      { status: 403 }
    );
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should return 401 when no auth token is provided', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test', {
      headers: {
        'x-tenant-id': testTenantId
      }
    });

    const mockHandler = jest.fn();

    // Act
    await withPermission(
      req,
      'setting' as ResourceType,
      'read' as Permission,
      mockHandler
    );

    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Authentication')
      }),
      { status: 401 }
    );
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should return 400 when no tenant ID is provided', async () => {
    // Arrange
    const req = new NextRequest('https://example.com/api/test', {
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    const mockHandler = jest.fn();

    // Act
    const response = await withPermission(
      req,
      'setting' as ResourceType,
      'read' as Permission,
      mockHandler
    );

    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Tenant ID required'
      }),
      { status: 400 }
    );
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
