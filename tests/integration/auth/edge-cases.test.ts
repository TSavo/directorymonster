/**
 * Authentication Edge Cases Integration Tests
 * 
 * Tests for edge cases in the authentication flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/auth/verify/route';
import { kv } from '@/lib/redis-client';
import { getAuthWorkerPool } from '@/lib/auth/worker-pool';
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

describe('Authentication Edge Cases', () => {
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
  
  describe('Missing or Invalid Parameters', () => {
    it('should reject requests with missing username', async () => {
      // Create a request with missing username
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          // username is missing
          proof: 'valid-proof',
          publicSignals: ['valid-signal']
        }
      });
      
      // Call the verify auth API endpoint
      const response = await verifyAuth(request);
      
      // Verify response is bad request
      expect(response.status).toBe(400);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Username is required');
    });
    
    it('should reject requests with missing proof', async () => {
      // Create a request with missing proof
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          // proof is missing
          publicSignals: ['valid-signal']
        }
      });
      
      // Call the verify auth API endpoint
      const response = await verifyAuth(request);
      
      // Verify response is bad request
      expect(response.status).toBe(400);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Proof is required');
    });
    
    it('should reject requests with missing public signals', async () => {
      // Create a request with missing public signals
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'testuser',
          proof: 'valid-proof'
          // publicSignals is missing
        }
      });
      
      // Call the verify auth API endpoint
      const response = await verifyAuth(request);
      
      // Verify response is bad request
      expect(response.status).toBe(400);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Public signals are required');
    });
    
    it('should reject requests with missing CSRF token', async () => {
      // Create a request with missing CSRF token
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // X-CSRF-Token is missing
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
      expect(data.error).toContain('CSRF token is required');
    });
  });
  
  describe('User Not Found', () => {
    it('should reject authentication for non-existent users', async () => {
      // Mock Redis to return null for user lookup
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      // Create a request with a non-existent user
      const request = createMockRequest('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token'
        },
        body: {
          username: 'nonexistentuser',
          proof: 'valid-proof',
          publicSignals: ['valid-signal']
        }
      });
      
      // Call the verify auth API endpoint
      const response = await verifyAuth(request);
      
      // Verify response is unauthorized
      expect(response.status).toBe(401);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid credentials');
      
      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FAILURE,
          username: 'nonexistentuser'
        })
      );
    });
  });
  
  describe('Worker Pool Errors', () => {
    it('should handle worker pool task failures', async () => {
      // Mock worker pool to return a task failure
      (getAuthWorkerPool().executeTask as jest.Mock).mockResolvedValueOnce({
        id: 'task-1',
        success: false,
        error: 'Worker task failed'
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
      
      // Verify response is an error
      expect(response.status).toBe(500);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Verification error');
      
      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SYSTEM_ERROR
        })
      );
    });
    
    it('should handle worker pool exceptions', async () => {
      // Mock worker pool to throw an exception
      (getAuthWorkerPool().executeTask as jest.Mock).mockRejectedValueOnce(
        new Error('Worker pool exception')
      );
      
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
      
      // Verify response is an error
      expect(response.status).toBe(500);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Verification error');
      
      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SYSTEM_ERROR
        })
      );
    });
  });
  
  describe('Redis Errors', () => {
    it('should handle Redis errors during user lookup', async () => {
      // Mock Redis to throw an error during user lookup
      (kv.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));
      
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
      
      // Verify response is an error
      expect(response.status).toBe(500);
      
      // Parse the response
      const data = await response.json();
      
      // Verify the error message
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Internal server error');
      
      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SYSTEM_ERROR
        })
      );
    });
  });
  
  describe('Progressive Delay', () => {
    it('should apply progressive delay for failed attempts', async () => {
      // Mock Redis to return a count for failed attempts
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user:testuser') {
          return Promise.resolve({
            id: 'user-1',
            username: 'testuser',
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        if (key === 'auth:delay:127.0.0.1') {
          return Promise.resolve(3); // 3 failed attempts
        }
        return Promise.resolve(null);
      });
      
      // Mock worker pool to return verification failure
      (getAuthWorkerPool().executeTask as jest.Mock).mockResolvedValueOnce({
        id: 'task-1',
        success: true,
        result: false
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
      
      // Verify the error message and delay
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid credentials');
      expect(data).toHaveProperty('retryAfter');
      expect(data.retryAfter).toBeGreaterThan(0);
      
      // Verify that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FAILURE
        })
      );
      
      // Verify that the delay was recorded
      expect(kv.set).toHaveBeenCalledWith('auth:delay:127.0.0.1', 4);
    });
  });
  
  describe('Concurrent Requests', () => {
    it('should handle concurrent authentication requests', async () => {
      // Create multiple requests
      const requests = Array(5).fill(null).map((_, i) => 
        createMockRequest('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'valid-csrf-token'
          },
          body: {
            username: `testuser${i}`,
            proof: 'valid-proof',
            publicSignals: ['valid-signal']
          },
          ip: `127.0.0.${i + 1}`
        })
      );
      
      // Mock Redis to return different user data for each request
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('user:testuser')) {
          const userIndex = key.replace('user:testuser', '');
          return Promise.resolve({
            id: `user-${userIndex || 1}`,
            username: `testuser${userIndex || ''}`,
            publicKey: 'test-public-key',
            role: 'user'
          });
        }
        return Promise.resolve(null);
      });
      
      // Execute all requests concurrently
      const responses = await Promise.all(requests.map(req => verifyAuth(req)));
      
      // Verify all responses are successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Verify that concurrency tracking was used for each request
      expect(kv.incr).toHaveBeenCalledTimes(10); // 5 requests * 2 incr calls
      expect(kv.decr).toHaveBeenCalledTimes(10); // 5 requests * 2 decr calls
    });
  });
});
