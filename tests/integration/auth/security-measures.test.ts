/**
 * Security Measures Integration Tests
 *
 * Tests for the integrated security measures in the authentication system.
 */

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/app/api/auth/verify/route';
import { kv } from '@/lib/redis-client';
import { getAuthWorkerPool } from '@/lib/auth/worker-pool';
import { verifyCaptcha, getCaptchaThreshold } from '@/lib/auth/captcha-service';
import { AuditService } from '@/lib/audit/audit-service';
import { AuditAction } from '@/lib/audit/types';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    expire: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn()
  }
}));

// Mock the worker pool
jest.mock('@/lib/auth/worker-pool', () => ({
  getAuthWorkerPool: jest.fn().mockReturnValue({
    executeTask: jest.fn()
  })
}));

// Mock the CAPTCHA service
jest.mock('@/lib/auth/captcha-service', () => ({
  verifyCaptcha: jest.fn(),
  getCaptchaThreshold: jest.fn(),
  recordFailedAttemptForCaptcha: jest.fn(),
  resetCaptchaRequirement: jest.fn()
}));

// Mock the ZKP-Bcrypt library
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  verifyZKPWithBcrypt: jest.fn(),
  generateZKPWithBcrypt: jest.fn(),
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateBcryptSalt: jest.fn()
}));

// Mock the jsonwebtoken library
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn()
}));

// Mock the Audit Service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: jest.fn()
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

describe('Authentication Security Measures Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting and Progressive Delay', () => {
    it('should apply rate limiting for repeated failed attempts', async () => {
      // Mock Redis to return a high count for rate limiting
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key.startsWith('rate-limit:')) {
          return Promise.resolve(11); // Above the limit
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
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.1'
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

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RATE_LIMIT_EXCEEDED,
          ip: '192.168.1.1'
        })
      );
    });
  });

  describe('IP Blocking', () => {
    it('should block authentication attempts from blocked IPs', async () => {
      // Mock Redis to return a block record
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'auth:blocked:192.168.1.2') {
          return Promise.resolve({
            blockedAt: Date.now() - 1000,
            reason: 'Too many failed login attempts',
            blockDuration: 24 * 60 * 60
          });
        }
        return Promise.resolve(null);
      });

      // Create a request from a blocked IP
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.2'
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

  describe('CAPTCHA Integration', () => {
    it('should require CAPTCHA after failed attempts', async () => {
      // Mock Redis to indicate CAPTCHA is required
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key.startsWith('auth:captcha:')) {
          return Promise.resolve(5); // Above the threshold
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
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.3'
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

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalled();
    });

    it('should accept authentication with valid CAPTCHA', async () => {
      // Mock Redis for CAPTCHA and user data
      (kv.get as jest.Mock).mockImplementation((key) => {
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
      const mockWorkerPool = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          success: true,
          result: true
        })
      };
      (getAuthWorkerPool as jest.Mock).mockReturnValue(mockWorkerPool);

      // Create a request with a CAPTCHA token
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'test-proof',
          publicSignals: ['test-signal'],
          captchaToken: 'valid-captcha-token'
        },
        ip: '192.168.1.3'
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

      // Verify that the worker pool was used
      expect(mockWorkerPool.executeTask).toHaveBeenCalled();

      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalled();
    });
  });

  describe('Worker Pool Integration', () => {
    it('should use the worker pool for proof verification', async () => {
      // Mock Redis for user data
      (kv.get as jest.Mock).mockImplementation((key) => {
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

      // Mock worker pool to verify the proof
      const mockWorkerPool = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          success: true,
          result: true
        })
      };
      (getAuthWorkerPool as jest.Mock).mockReturnValue(mockWorkerPool);

      // Create a request
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.4'
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is successful
      expect(response.status).toBe(200);

      // Verify that the worker pool was used
      expect(mockWorkerPool.executeTask).toHaveBeenCalledWith({
        type: 'verify',
        data: {
          proof: 'test-proof',
          publicSignals: ['test-signal'],
          publicKey: 'test-public-key'
        }
      });
    });

    it('should handle worker pool errors', async () => {
      // Mock Redis for user data
      (kv.get as jest.Mock).mockImplementation((key) => {
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

      // Mock worker pool to return an error
      const mockWorkerPool = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          success: false,
          error: 'Worker error'
        })
      };
      (getAuthWorkerPool as jest.Mock).mockReturnValue(mockWorkerPool);

      // Create a request
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.4'
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is an error
      expect(response.status).toBe(500);

      // Parse the response
      const data = await response.json();

      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Verification error');
    });
  });

  describe('Concurrency Management', () => {
    it('should track and complete authentication requests', async () => {
      // Mock Redis for user data and concurrency tracking
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'user:testuser') {
          return Promise.resolve({
            id: 'user-1',
            username: 'testuser',
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        if (key === 'auth:request:concurrent') {
          return Promise.resolve(5); // Below the limit
        }
        return Promise.resolve(null);
      });

      // Mock worker pool to verify the proof
      const mockWorkerPool = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          success: true,
          result: true
        })
      };
      (getAuthWorkerPool as jest.Mock).mockReturnValue(mockWorkerPool);

      // Create a request
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.5'
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is successful
      expect(response.status).toBe(200);

      // Verify that concurrency tracking was used
      expect(kv.incr).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.incr).toHaveBeenCalledWith('auth:request:testuser');
      expect(kv.decr).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.decr).toHaveBeenCalledWith('auth:request:testuser');
    });

    it('should reject requests when too many concurrent requests', async () => {
      // Mock Redis for concurrency tracking
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'auth:request:concurrent') {
          return Promise.resolve(100); // At the limit
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
          proof: 'test-proof',
          publicSignals: ['test-signal']
        },
        ip: '192.168.1.6'
      });

      // Call the verify auth API endpoint
      const response = await verifyAuth(request);

      // Verify response is service unavailable
      expect(response.status).toBe(503);

      // Parse the response
      const data = await response.json();

      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authentication system is busy');
    });
  });
});
