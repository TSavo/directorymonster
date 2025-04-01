/**
 * Tests for admin routes permission middleware
 *
 * These tests verify that the admin routes are properly secured with the correct
 * permission middleware and that the middleware is called with the correct parameters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission, withResourcePermission } from '@/middleware/withPermission';
import { RoleService } from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/role-service');
jest.mock('jsonwebtoken');

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((data, options) => ({ data, status: options?.status || 200 }))
    }
  };
});

describe('Admin Routes Permission Middleware', () => {
  // Test data
  const TEST_USER_ID = 'permission-test-user';
  const TEST_TENANT_ID = 'permission-test-tenant';
  const TEST_SECRET = 'test-secret';
  const TEST_TOKEN = 'valid-token'; // We'll mock the jwt.verify to return our test user

  // Set up JWT_SECRET for testing
  process.env.JWT_SECRET = TEST_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock jwt.verify to return our test user
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'test-user-id' });

    // Mock RoleService.hasPermission to return true by default
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
  });

  describe('withPermission middleware', () => {
    it('should call the handler when user has permission', async () => {
      // Arrange
      const req = new NextRequest('https://example.com/api/admin/test', {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // Act
      const result = await withPermission(
        req,
        'listing' as ResourceType,
        'read' as Permission,
        mockHandler
      );

      // Assert
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        TEST_TENANT_ID,
        'listing',
        'read',
        undefined
      );
      expect(mockHandler).toHaveBeenCalledWith(req);
    });

    it('should return 403 when user lacks permission', async () => {
      // Arrange
      const req = new NextRequest('https://example.com/api/admin/test', {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      // Mock permission check to fail
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);

      const mockHandler = jest.fn();

      // Act
      const result = await withPermission(
        req,
        'listing' as ResourceType,
        'read' as Permission,
        mockHandler
      );

      // Assert
      expect(result.status).toBe(403);
      expect(result.data).toHaveProperty('error', 'Permission denied');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('withResourcePermission middleware', () => {
    it('should call the handler when user has permission for a specific resource', async () => {
      // Arrange
      const resourceId = 'test-resource-id';
      const req = new NextRequest(`https://example.com/api/admin/listings/${resourceId}`, {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // Act
      const result = await withResourcePermission(
        req,
        'listing' as ResourceType,
        'read' as Permission,
        mockHandler,
        resourceId
      );

      // Assert
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'test-user-id',
        TEST_TENANT_ID,
        'listing',
        'read',
        resourceId
      );
      expect(mockHandler).toHaveBeenCalledWith(req);
    });

    it('should return 403 when user lacks permission for a specific resource', async () => {
      // Arrange
      const resourceId = 'test-resource-id';
      const req = new NextRequest(`https://example.com/api/admin/listings/${resourceId}`, {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      // Mock permission check to fail
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);

      const mockHandler = jest.fn();

      // Act
      const result = await withResourcePermission(
        req,
        'listing' as ResourceType,
        'read' as Permission,
        mockHandler,
        resourceId
      );

      // Assert
      expect(result.status).toBe(403);
      expect(result.data).toHaveProperty('error', 'Permission denied');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
