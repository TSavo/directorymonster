import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../../../api/admin/users/route.mock';
import * as usersService from '@/services/users';
import { verifySession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/services/users', () => require('../../../__mocks__/users-service'));
jest.mock('@/lib/auth');
jest.mock('@/lib/db', () => require('../../../__mocks__/db'));

describe('Users API Routes', () => {
  // Create a mock request
  const createMockRequest = (method: string, body?: any, customHeaders?: Headers) => {
    const headers = customHeaders || new Headers();
    headers.set('Content-Type', 'application/json');

    const request = {
      method,
      headers,
      json: jest.fn().mockResolvedValue(body || {}),
    } as unknown as NextRequest;

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
              permission: 'create'
            }
          ]
        }
      }
    });
  });

  describe('GET handler', () => {
    it('returns users when authenticated with permissions', async () => {
      // The users service is already mocked in the __mocks__/users-service.js file

      // Execute request
      const request = createMockRequest('GET');
      const response = await GET(request);

      // Assert response
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('users');
      expect(Array.isArray(responseData.users)).toBe(true);
      expect(responseData.users.length).toBeGreaterThan(0);

      // Verify service was called
      expect(usersService.getUsers).toHaveBeenCalled();
    });

    it('returns 401 when not authenticated', async () => {
      // Create a request with auth header set to 'none'
      const headers = new Headers();
      headers.set('x-test-auth', 'none');

      // Execute request
      const request = createMockRequest('GET', undefined, headers);
      const response = await GET(request);

      // Assert response
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'Unauthorized' });

      // Verify service was not called
      expect(usersService.getUsers).not.toHaveBeenCalled();
    });

    it('returns 403 when missing required permissions', async () => {
      // Create a request with auth header set to 'no-permission'
      const headers = new Headers();
      headers.set('x-test-auth', 'no-permission');

      // Execute request
      const request = createMockRequest('GET', undefined, headers);
      const response = await GET(request);

      // Assert response
      expect(response.status).toBe(403);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'Forbidden' });

      // Verify service was not called
      expect(usersService.getUsers).not.toHaveBeenCalled();
    });

    it('handles service errors', async () => {
      // Create a request with error header set to 'true'
      const headers = new Headers();
      headers.set('x-test-error', 'true');

      // Execute request
      const request = createMockRequest('GET', undefined, headers);
      const response = await GET(request);

      // Assert response
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'Internal Server Error' });
    });
  });

  describe('POST handler', () => {
    it('creates user when authenticated with permissions', async () => {
      // The users service is already mocked in the __mocks__/users-service.js file
      const newUserData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        siteIds: ['site1']
      };

      // The mock will return a user with these properties plus an ID and createdAt

      // Execute request
      const request = createMockRequest('POST', newUserData);
      const response = await POST(request);

      // Assert response
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('user');
      expect(responseData.user).toHaveProperty('id', 'new-user-id');
      expect(responseData.user).toHaveProperty('name', newUserData.name);
      expect(responseData.user).toHaveProperty('email', newUserData.email);

      // Verify service was called with correct data
      expect(usersService.createUser).toHaveBeenCalledWith(newUserData);
    });

    it('returns 401 when not authenticated', async () => {
      // Create a request with auth header set to 'none'
      const headers = new Headers();
      headers.set('x-test-auth', 'none');

      // Execute request
      const request = createMockRequest('POST', { name: 'Test' }, headers);
      const response = await POST(request);

      // Assert response
      expect(response.status).toBe(401);

      // Verify service was not called
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('returns 403 when missing required permissions', async () => {
      // Create a request with auth header set to 'no-permission'
      const headers = new Headers();
      headers.set('x-test-auth', 'no-permission');

      // Execute request
      const request = createMockRequest('POST', { name: 'Test' }, headers);
      const response = await POST(request);

      // Assert response
      expect(response.status).toBe(403);

      // Verify service was not called
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid user data', async () => {
      // Invalid email format
      const invalidUserData = {
        name: 'Invalid User',
        email: 'invalid-email'
      };

      // The users service mock will reject with a validation error for invalid-email

      // Execute request
      const request = createMockRequest('POST', invalidUserData);
      const response = await POST(request);

      // Assert response
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('Validation failed');
    });

    it('handles service errors', async () => {
      // Create a request with error header set to 'true'
      const headers = new Headers();
      headers.set('x-test-error', 'true');

      // Execute request
      const request = createMockRequest('POST', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        siteIds: ['site1']
      }, headers);
      const response = await POST(request);

      // Assert response
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toEqual({ message: 'Internal Server Error' });
    });
  });
});
