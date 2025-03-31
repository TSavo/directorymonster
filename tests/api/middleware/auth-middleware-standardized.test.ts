/**
 * Authentication Middleware Tests
 * Using standardized mocks
 */

import { NextRequest } from 'next/server';
import { withAuthentication } from '@/app/api/middleware';

// Import standardized mocks
import { createMockNextRequest } from '../../mocks/next/request';
import { mockNextResponseJson, parseResponseBody } from '../../mocks/next/response';
import {
  VALID_TOKEN,
  INVALID_TOKEN,
  setupJwtMock,
  verify,
  DEFAULT_USER_ID
} from '../../mocks/lib/auth/jwt';

// Set up JWT mock
setupJwtMock();

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // We'll use the standardized createMockNextRequest function

  describe('withAuthentication', () => {
    it('should reject requests without authentication', async () => {
      // Create a request without authorization header
      const req = createMockNextRequest({
        headers: { 'authorization': undefined }
      });

      const handler = jest.fn().mockResolvedValue(
        mockNextResponseJson({ success: true })
      );

      await withAuthentication(req, handler);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token format', async () => {
      // Create a request with invalid token format
      const req = createMockNextRequest({
        headers: { 'authorization': 'InvalidFormat' }
      });

      const handler = jest.fn().mockResolvedValue(
        mockNextResponseJson({ success: true })
      );

      await withAuthentication(req, handler);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', async () => {
      // Create a request with invalid token
      const req = createMockNextRequest({
        headers: { 'authorization': `Bearer ${INVALID_TOKEN}` }
      });

      const handler = jest.fn().mockResolvedValue(
        mockNextResponseJson({ success: true })
      );

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow requests with valid token', async () => {
      // Create a request with valid token
      const req = createMockNextRequest({
        headers: { 'authorization': `Bearer ${VALID_TOKEN}` }
      });

      const handlerResult = { success: true };
      const mockResponse = mockNextResponseJson(handlerResult);
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const result = await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, DEFAULT_USER_ID);

      // Check that the result is the mockResponse
      expect(result).toBe(mockResponse);
    });

    it('should handle token verification errors', async () => {
      // Create a request with invalid token
      const req = createMockNextRequest({
        headers: { 'authorization': `Bearer ${INVALID_TOKEN}` }
      });

      const handler = jest.fn().mockResolvedValue(
        mockNextResponseJson({ success: true })
      );

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
    });

    it('should handle unexpected errors in the handler', async () => {
      // Create a request with valid token
      const req = createMockNextRequest({
        headers: { 'authorization': `Bearer ${VALID_TOKEN}` }
      });

      // Mock the handler to throw an error
      const handlerError = new Error('Unexpected error');
      const handler = jest.fn().mockImplementation(() => {
        throw handlerError;
      });

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, DEFAULT_USER_ID);
      
      // The implementation returns an error when an unexpected error occurs
      // In this case, it's returning an "Invalid token" error with a 401 status
      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
    });
  });
});