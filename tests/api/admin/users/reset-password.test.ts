import { NextRequest } from 'next/server';
import { POST } from '../../../api/admin/users/reset-password/route.mock';

// Import mocks directly
const { verifySession } = require('@/lib/auth');
const { generatePasswordResetToken } = require('@/lib/crypto');

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/crypto');
jest.mock('@/lib/db', () => require('../../../__mocks__/db'));
jest.mock('@/lib/email', () => require('../../../__mocks__/email'));

describe('Reset Password API Route', () => {
  // Create a mock request
  const createMockRequest = (body?: any, customHeaders?: Headers) => {
    const headers = customHeaders || new Headers();
    headers.set('Content-Type', 'application/json');

    const request = {
      method: 'POST',
      headers,
      json: jest.fn().mockResolvedValue(body || {}),
    } as unknown as NextRequest;

    return request;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock verifySession to return authenticated admin user by default
    (verifySession as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 'admin-user',
        acl: {
          userId: 'admin-user',
          entries: [
            {
              resource: { type: 'user' },
              permission: 'update'
            }
          ]
        }
      }
    });

    // Mock generate token
    (generatePasswordResetToken as jest.Mock).mockResolvedValue('reset-token-123');
  });

  it('initiates password reset when authenticated with permissions', async () => {
    // Mock user data and service response
    const requestData = {
      email: 'user@example.com'
    };

    // Get the mock db module
    const dbMock = require('../../../__mocks__/db');

    // Mock the findUserByEmail method
    dbMock.findUserByEmail = jest.fn().mockResolvedValue({
      id: 'user1',
      email: 'user@example.com'
    });

    // Mock the email module
    const emailMock = require('../../../__mocks__/email');

    // Execute request
    const request = createMockRequest(requestData);
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      success: true,
      message: 'Password reset initiated'
    });

    // Verify services were called
    expect(dbMock.findUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(generatePasswordResetToken).toHaveBeenCalled();
    expect(emailMock.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', async () => {
    // Create a request with auth header set to 'none'
    const headers = new Headers();
    headers.set('x-test-auth', 'none');

    // Execute request
    const request = createMockRequest({ email: 'user@example.com' }, headers);
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toEqual({ message: 'Unauthorized' });

    // Verify services were not called
    const dbMock = require('../../../__mocks__/db');
    const emailMock = require('../../../__mocks__/email');

    expect(dbMock.findUserByEmail).not.toHaveBeenCalled();
    expect(generatePasswordResetToken).not.toHaveBeenCalled();
    expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns 403 when missing required permissions', async () => {
    // Create a request with auth header set to 'no-permission'
    const headers = new Headers();
    headers.set('x-test-auth', 'no-permission');

    // Execute request
    const request = createMockRequest({ email: 'user@example.com' }, headers);
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(403);
    const responseData = await response.json();
    expect(responseData).toEqual({ message: 'Forbidden' });

    // Verify services were not called
    const dbMock = require('../../../__mocks__/db');
    expect(dbMock.findUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    // Execute request with empty body
    const request = createMockRequest({});
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: 'Email is required' });
  });

  it('returns 404 when user not found', async () => {
    // Mock user not found
    const dbMock = require('../../../__mocks__/db');
    dbMock.findUserByEmail = jest.fn().mockResolvedValue(null);

    // Execute request
    const request = createMockRequest({ email: 'nonexistent@example.com' });
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(404);
    const responseData = await response.json();
    expect(responseData).toEqual({ message: 'User not found' });

    // Verify token generation was not called
    expect(generatePasswordResetToken).not.toHaveBeenCalled();
    const emailMock = require('../../../__mocks__/email');
    expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('handles service errors', async () => {
    // Mock service error
    const dbMock = require('../../../__mocks__/db');
    dbMock.findUserByEmail = jest.fn().mockResolvedValue({
      id: 'user1',
      email: 'user@example.com'
    });

    const emailMock = require('../../../__mocks__/email');
    emailMock.sendPasswordResetEmail.mockRejectedValue(
      new Error('Email service error')
    );

    // Execute request
    const request = createMockRequest({ email: 'user@example.com' });
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: 'Failed to request password reset' });
  });
});
