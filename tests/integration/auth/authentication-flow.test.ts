/**
 * Authentication Flow Integration Tests
 *
 * Tests for the integrated authentication flow with security measures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/auth/verify/route';
import { kv } from '@/lib/redis-client';
import { getAuthWorkerPool } from '@/lib/auth/worker-pool';
import { verifyCaptcha, getCaptchaThreshold } from '@/lib/auth/captcha-service';
import { isIpBlocked } from '@/lib/auth/ip-blocker';
import { AuditService } from '@/lib/audit/audit-service';
import { AuditAction } from '@/lib/audit/types';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1)
  }
}));

// Mock the worker pool
jest.mock('@/lib/auth/worker-pool', () => ({
  getAuthWorkerPool: jest.fn().mockReturnValue({
    executeTask: jest.fn().mockResolvedValue({
      id: 'task-1',
      success: true,
      result: true
    })
  })
}));

// Mock the CAPTCHA service
jest.mock('@/lib/auth/captcha-service', () => ({
  verifyCaptcha: jest.fn(),
  getCaptchaThreshold: jest.fn(),
  recordFailedAttemptForCaptcha: jest.fn(),
  resetCaptchaRequirement: jest.fn()
}));

// Mock the IP blocker
jest.mock('@/lib/auth/ip-blocker', () => ({
  isIpBlocked: jest.fn().mockResolvedValue(false),
  recordFailedAttempt: jest.fn(),
  resetFailedAttempts: jest.fn(),
  getIpRiskLevel: jest.fn()
}));

// Mock the ZKP-Bcrypt library
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  verifyZKPWithBcrypt: jest.fn().mockResolvedValue(true),
  generateZKPWithBcrypt: jest.fn().mockResolvedValue({
    proof: 'test-proof',
    publicSignals: ['test-signal']
  }),
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  generateBcryptSalt: jest.fn().mockReturnValue('test-salt')
}));

// Mock the jsonwebtoken library
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-1', username: 'testuser' })
}));

// Mock the Audit Service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: jest.fn().mockResolvedValue(undefined)
  }
}));

// Helper function to create a mock request
function createMockRequest(url: string, options: any = {}): NextRequest {
  const { headers = {}, method = 'GET', body = null } = options;

  // Create headers object
  const headersObj = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headersObj.set(key, value as string);
  });

  // Create request object
  const req = {
    url,
    method,
    headers: headersObj,
    ip: options.ip || '127.0.0.1',
    nextUrl: new URL(url, 'http://localhost'),
    json: jest.fn().mockResolvedValue(body)
  } as unknown as NextRequest;

  return req;
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user data
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'user:testuser') {
        return Promise.resolve({
          id: 'user-1',
          username: 'testuser',
          publicKey: 'test-public-key',
          role: 'user'
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('Successful Authentication', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Create a request with valid credentials
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'valid-proof',
          publicSignals: ['valid-signal']
        }
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is successful
      expect(response.status).toBe(200);

      // Parse the response
      const data = await response.json();

      // Verify the success response
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('token');
      expect(data.token).toBe('mock-jwt-token');

      // Verify that the worker pool was used
      expect(getAuthWorkerPool().executeTask).toHaveBeenCalled();

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SUCCESSFUL_LOGIN,
          username: 'testuser'
        })
      );

      // Verify that concurrency tracking was used
      expect(kv.incr).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.incr).toHaveBeenCalledWith('auth:request:testuser');
      expect(kv.decr).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.decr).toHaveBeenCalledWith('auth:request:testuser');
    });
  });

  describe('Failed Authentication', () => {
    it('should reject authentication with invalid credentials', async () => {
      // Mock worker pool to return verification failure
      (getAuthWorkerPool().executeTask as jest.Mock).mockResolvedValueOnce({
        id: 'task-1',
        success: true,
        result: false
      });

      // Create a request with invalid credentials
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'invalid-proof',
          publicSignals: ['invalid-signal']
        }
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is unauthorized
      expect(response.status).toBe(401);

      // Parse the response
      const data = await response.json();

      // Verify the error response
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid credentials');

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.FAILED_LOGIN,
          username: 'testuser'
        })
      );

      // Verify that failed attempt was recorded
      expect(kv.set).toHaveBeenCalled();
    });

    it('should require CAPTCHA after multiple failed attempts', async () => {
      // Mock Redis to indicate CAPTCHA is required
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:captcha:')) {
          return Promise.resolve(5); // Above the threshold
        }
        if (key === 'user:testuser') {
          return Promise.resolve({
            id: 'user-1',
            username: 'testuser',
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        return Promise.resolve(null);
      });

      // Mock CAPTCHA threshold
      (getCaptchaThreshold as jest.Mock).mockResolvedValue(3);

      // Create a request without a CAPTCHA token
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'valid-proof',
          publicSignals: ['valid-signal']
        }
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is forbidden
      expect(response.status).toBe(403);

      // Parse the response
      const data = await response.json();

      // Verify the error message and CAPTCHA requirement
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('CAPTCHA verification failed');
      expect(data).toHaveProperty('requireCaptcha');
      expect(data.requireCaptcha).toBe(true);
    });

    it('should accept authentication with valid CAPTCHA', async () => {
      // Mock Redis to indicate CAPTCHA is required
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:captcha:')) {
          return Promise.resolve(5); // Above the threshold
        }
        if (key === 'user:testuser') {
          return Promise.resolve({
            id: 'user-1',
            username: 'testuser',
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        return Promise.resolve(null);
      });

      // Mock CAPTCHA verification
      (verifyCaptcha as jest.Mock).mockResolvedValue(true);

      // Mock CAPTCHA threshold
      (getCaptchaThreshold as jest.Mock).mockResolvedValue(3);

      // Mock worker pool to verify the proof
      (getAuthWorkerPool as jest.Mock).mockReturnValue({
        executeTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          success: true,
          result: true
        })
      });

      // Mock ZKP verification
      const { verifyZKPWithBcrypt } = require('@/lib/zkp/zkp-bcrypt');
      (verifyZKPWithBcrypt as jest.Mock).mockResolvedValue(true);

      // Create a request with a CAPTCHA token
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'valid-proof',
          publicSignals: ['valid-signal'],
          captchaToken: 'valid-captcha-token'
        }
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is successful
      expect(response.status).toBe(200);

      // Parse the response
      const data = await response.json();

      // Verify the success response
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('token');

      // Verify that CAPTCHA verification was called
      expect(verifyCaptcha).toHaveBeenCalledWith('valid-captcha-token', expect.any(String));
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting for repeated failed attempts', async () => {
      // Mock Redis to return a high count for rate limiting
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('rate-limit:')) {
          return Promise.resolve(11); // Above the limit
        }
        if (key === 'user:testuser') {
          return Promise.resolve({
            id: 'user-1',
            username: 'testuser',
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        return Promise.resolve(null);
      });

      // Create a request
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'valid-proof',
          publicSignals: ['valid-signal']
        }
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is rate limited
      expect(response.status).toBe(429);

      // Parse the response
      const data = await response.json();

      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Too many login attempts');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Please try again later');

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RATE_LIMIT_EXCEEDED
        })
      );
    });
  });

  describe('IP Blocking', () => {
    it('should block authentication attempts from blocked IPs', async () => {
      // Mock Redis to return a block record
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:blocked:')) {
          return Promise.resolve({
            blockedAt: Date.now() - 1000,
            reason: 'Too many failed login attempts',
            blockDuration: 24 * 60 * 60
          });
        }
        if (key === 'user:testuser') {
          return Promise.resolve({
            id: 'user-1',
            username: 'testuser',
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        return Promise.resolve(null);
      });

      // Mock IP blocking check
      (isIpBlocked as jest.Mock).mockResolvedValue(true);

      // Create a request from a blocked IP
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'valid-proof',
          publicSignals: ['valid-signal']
        }
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is forbidden
      expect(response.status).toBe(403);

      // Parse the response
      const data = await response.json();

      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('IP address is blocked');

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalled();
    });
  });
});
