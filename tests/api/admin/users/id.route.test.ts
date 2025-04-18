import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../../../api/admin/users/[id]/route.mock';
import * as usersService from '@/services/users';
import { verifySession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/services/users');
jest.mock('@/lib/auth', () => require('../../../__mocks__/auth'));
jest.mock('@/lib/db', () => require('../../../__mocks__/db'));

describe('User ID API Routes', () => {
  // Create a mock request
  const createMockRequest = (method: string, body?: any, userId: string = 'user1', customHeaders?: Headers) => {
    const headers = customHeaders || new Headers();
    headers.set('Content-Type', 'application/json');

    const request = {
      method,
      headers,
      json: jest.fn().mockResolvedValue(body || {}),
      nextUrl: {
        pathname: `/api/admin/users/${userId}`
      },
      params: {
        id: userId
      }
    } as unknown as NextRequest & { params: { id: string } };

    return request;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock verifySession to return authenticated user by default
    (verifySession as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 'admin-user',
        acl: {
          userId: 'admin-user',
          entries: [
            {
              resource: { type: 'user' },
              permission: 'read'
            },
            {
              resource: { type: 'user' },
              permission: 'update'
            },
            {
              resource: { type: 'user' },
              permission: 'delete'
            }
          ]
        }
      }
    });
  });

  describe('GET handler', () => {
    it('returns user when authenticated with permissions', async () => {
      // Mock user data
      const mockUser = {
        id: 'user1',
        name: 'User 1',
        email: 'user1@example.com',
        siteIds: ['site1'],
        acl: { userId: 'user1', entries: [] },
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      };

      (usersService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      // Execute request
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual({ user: mockUser });

      // Verify service was called
      expect(usersService.getUserById).toHaveBeenCalledWith('user1');
    });

    it('returns 404 when user not found', async () => {
      // Mock user not found
      (usersService.getUserById as jest.Mock).mockResolvedValue(null);

      // Execute request
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { id: 'nonexistent' } });

      // Assert response
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'User not found' });
    });

    it('returns 401 when not authenticated', async () => {
      // Create a request with auth header set to 'none'
      const headers = new Headers();
      headers.set('x-test-auth', 'none');

      // Execute request
      const request = createMockRequest('GET', undefined, 'user1', headers);
      const response = await GET(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(401);

      // Verify service was not called
      expect(usersService.getUserById).not.toHaveBeenCalled();
    });

    it('returns 403 when missing required permissions', async () => {
      // Create a request with auth header set to 'no-permission'
      const headers = new Headers();
      headers.set('x-test-auth', 'no-permission');

      // Execute request
      const request = createMockRequest('GET', undefined, 'user1', headers);
      const response = await GET(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(403);

      // Verify service was not called
      expect(usersService.getUserById).not.toHaveBeenCalled();
    });
  });

  describe('PATCH handler', () => {
    it('updates user when authenticated with permissions', async () => {
      // Mock update data and response
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };

      const updatedUser = {
        id: 'user1',
        name: 'Updated User',
        email: 'updated@example.com',
        siteIds: ['site1'],
        acl: { userId: 'user1', entries: [] },
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02'
      };

      (usersService.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      // Execute request
      const request = createMockRequest('PATCH', updateData);
      const response = await PATCH(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual({ user: updatedUser });

      // Verify service was called with correct data
      expect(usersService.updateUser).toHaveBeenCalledWith({
        id: 'user1',
        ...updateData
      });
    });

    it('returns 404 when user not found', async () => {
      // Mock user not found
      (usersService.updateUser as jest.Mock).mockResolvedValue(null);

      // Execute request
      const request = createMockRequest('PATCH', { name: 'Updated' });
      const response = await PATCH(request, { params: { id: 'nonexistent' } });

      // Assert response
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'User not found' });
    });

    it('returns 401 when not authenticated', async () => {
      // Create a request with auth header set to 'none'
      const headers = new Headers();
      headers.set('x-test-auth', 'none');

      // Execute request
      const request = createMockRequest('PATCH', { name: 'Updated' }, 'user1', headers);
      const response = await PATCH(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(401);

      // Verify service was not called
      expect(usersService.updateUser).not.toHaveBeenCalled();
    });

    it('returns 403 when missing required permissions', async () => {
      // Create a request with auth header set to 'no-permission'
      const headers = new Headers();
      headers.set('x-test-auth', 'no-permission');

      // Execute request
      const request = createMockRequest('PATCH', { name: 'Updated' }, 'user1', headers);
      const response = await PATCH(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(403);

      // Verify service was not called
      expect(usersService.updateUser).not.toHaveBeenCalled();
    });

    it('handles validation errors', async () => {
      // Mock validation error
      (usersService.updateUser as jest.Mock).mockRejectedValue(
        new Error('Validation failed: invalid email format')
      );

      // Execute request
      const request = createMockRequest('PATCH', { email: 'invalid-email' });
      const response = await PATCH(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('Validation failed');
    });
  });

  describe('DELETE handler', () => {
    it('deletes user when authenticated with permissions', async () => {
      // Mock successful deletion
      (usersService.deleteUser as jest.Mock).mockResolvedValue(true);

      // Execute request
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual({ success: true });

      // Verify service was called with correct id
      expect(usersService.deleteUser).toHaveBeenCalledWith('user1');
    });

    it('returns 404 when user not found', async () => {
      // Mock user not found
      (usersService.deleteUser as jest.Mock).mockResolvedValue(false);

      // Execute request
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });

      // Assert response
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'User not found' });
    });

    it('returns 401 when not authenticated', async () => {
      // Create a request with auth header set to 'none'
      const headers = new Headers();
      headers.set('x-test-auth', 'none');

      // Execute request
      const request = createMockRequest('DELETE', undefined, 'user1', headers);
      const response = await DELETE(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(401);

      // Verify service was not called
      expect(usersService.deleteUser).not.toHaveBeenCalled();
    });

    it('returns 403 when missing required permissions', async () => {
      // Create a request with auth header set to 'no-permission'
      const headers = new Headers();
      headers.set('x-test-auth', 'no-permission');

      // Execute request
      const request = createMockRequest('DELETE', undefined, 'user1', headers);
      const response = await DELETE(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(403);

      // Verify service was not called
      expect(usersService.deleteUser).not.toHaveBeenCalled();
    });

    it('handles service errors', async () => {
      // Mock service error
      (usersService.deleteUser as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Execute request
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: 'user1' } });

      // Assert response
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'Internal Server Error' });
    });
  });
});
