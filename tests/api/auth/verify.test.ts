/**
 * @jest-environment node
 */
import { POST as verifyAuth } from '@/app/api/auth/verify/route';
import { createMockRequest } from '../../integration/setup';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => {
  return {
    kv: {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    },
    redis: {
      multi: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        get: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
      }),
      ping: jest.fn().mockResolvedValue('PONG'),
    },
  };
});

// Mock the worker pool
jest.mock('@/lib/auth/worker-pool', () => {
  const mockWorkerPool = {
    executeTask: jest.fn().mockResolvedValue({
      id: 'task-1',
      success: true,
      result: true
    }),
    shutdown: jest.fn().mockResolvedValue(undefined)
  };

  return {
    getAuthWorkerPool: jest.fn().mockReturnValue(mockWorkerPool)
  };
});

// Mock the ZKP-Bcrypt library
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  verifyZKPWithBcrypt: jest.fn().mockResolvedValue(true),
  generateZKPWithBcrypt: jest.fn().mockResolvedValue({
    proof: 'mock-proof-string',
    publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
  }),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  generateBcryptSalt: jest.fn().mockResolvedValue('$2b$10$mockedsalt'),
}));

// Mock the jsonwebtoken library
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockImplementation((token) => {
    if (token === 'valid-token') {
      return { username: 'testuser', role: 'admin' };
    }
    throw new Error('Invalid token');
  }),
}));

// Set up mock user data
const mockUsers = {
  'testuser': {
    id: 'user-id-1',
    username: 'testuser',
    salt: 'test-salt-value',
    publicKey: 'test-public-key',
    role: 'admin',
    lastLogin: Date.now() - 86400000, // 1 day ago
    createdAt: Date.now() - 30 * 86400000, // 30 days ago
  },
  'readonlyuser': {
    id: 'user-id-2',
    username: 'readonlyuser',
    salt: 'test-salt-value-2',
    publicKey: 'test-public-key-2',
    role: 'viewer',
    lastLogin: Date.now() - 86400000, // 1 day ago
    createdAt: Date.now() - 15 * 86400000, // 15 days ago
  },
  'lockeduser': {
    id: 'user-id-3',
    username: 'lockeduser',
    salt: 'test-salt-value-3',
    publicKey: 'test-public-key-3',
    role: 'editor',
    locked: true,
    lastLogin: Date.now() - 86400000, // 1 day ago
    createdAt: Date.now() - 45 * 86400000, // 45 days ago
  }
};

describe('Auth Verification API', () => {
  // Shutdown the worker pool after all tests
  afterAll(async () => {
    const { getAuthWorkerPool } = require('@/lib/auth/worker-pool');
    const workerPool = getAuthWorkerPool();
    await workerPool.shutdown();
  });

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Configure Redis mock to return user data
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation(async (key) => {
      if (key.startsWith('user:')) {
        const username = key.replace('user:', '');
        return mockUsers[username] || null;
      }
      // By default, no rate limiting
      if (key.startsWith('ratelimit:')) {
        return null;
      }
      return null;
    });

    // Configure ZKP verifyZKPWithBcrypt mock
    const { verifyZKPWithBcrypt } = require('@/lib/zkp/zkp-bcrypt');
    verifyZKPWithBcrypt.mockImplementation(async (proof, publicSignals, publicKey) => {
      // Only return true for testuser with correct public key
      if (publicKey === 'test-public-key') {
        return true;
      }
      return false;
    });
  });

  it('should reject requests without required fields', async () => {
    // Create request without required fields
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {},
    });

    // Call the verify auth API endpoint
    const response = await verifyAuth(request);

    // Verify response is bad request
    expect(response.status).toBe(400);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required fields');
  });

  it('should reject requests for non-existent users', async () => {
    // Create request for non-existent user
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'nonexistentuser',
        proof: 'mock-proof-string',
        publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
      },
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
  });

  it('should reject verification for locked users', async () => {
    // Create request for a locked user
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'lockeduser',
        proof: 'mock-proof-string',
        publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
      },
    });

    // Call the verify auth API endpoint
    const response = await verifyAuth(request);

    // Verify response is forbidden
    expect(response.status).toBe(403);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Account locked');
  });

  it('should reject invalid proofs', async () => {
    // Force verifyZKPWithBcrypt to return false for this test
    const { verifyZKPWithBcrypt } = require('@/lib/zkp/zkp-bcrypt');
    verifyZKPWithBcrypt.mockImplementationOnce(async () => false);

    // Mock worker pool to return false for this test
    const { getAuthWorkerPool } = require('@/lib/auth/worker-pool');
    const mockWorkerPool = getAuthWorkerPool();
    mockWorkerPool.executeTask.mockImplementationOnce(async () => ({
      id: 'task-1',
      success: true,
      result: false
    }));

    // Create request with invalid proof
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'testuser',
        proof: 'invalid-proof-string',
        publicSignals: ['invalid-signal-1', 'invalid-signal-2'],
      },
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
  });

  it('should verify valid credentials and return a token', async () => {
    // Create request with valid credentials
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'testuser',
        proof: 'valid-proof-string',
        publicSignals: ['valid-signal-1', 'valid-signal-2'],
      },
      headers: {
        'X-CSRF-Token': 'valid-csrf-token'
      }
    });

    // Call the verify auth API endpoint
    const response = await verifyAuth(request);

    // Verify response is successful
    expect(response.status).toBe(200);

    // Parse the response
    const data = await response.json();

    // Verify the token and user info are returned
    expect(data).toHaveProperty('token', 'mock-jwt-token');
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('username', 'testuser');
    expect(data.user).toHaveProperty('role', 'admin');

    // Verify Redis was called to update the last login time
    const { kv } = require('@/lib/redis-client');
    expect(kv.set).toHaveBeenCalledWith(
      `user:${mockUsers['testuser'].username}`,
      expect.objectContaining({
        ...mockUsers['testuser'],
        lastLogin: expect.any(String)
      })
    );
  });

  it('should handle rate limiting for too many failed attempts', async () => {
    // Mock Redis to simulate rate limiting
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation(async (key: string) => {
      if (key === 'rate-limit:login:testuser') {
        return 10; // 10 failed attempts, above threshold
      }
      if (key.startsWith('user:')) {
        const username = key.replace('user:', '');
        return mockUsers[username] || null;
      }
      return null;
    });

    // Mock the progressive delay module
    jest.mock('@/lib/auth/progressive-delay', () => ({
      shouldRateLimit: jest.fn().mockReturnValue(true),
      getDelaySeconds: jest.fn().mockReturnValue(30),
      recordFailedAttempt: jest.fn()
    }));

    // Create request
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'testuser',
        proof: 'mock-proof-string',
        publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
      },
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

    // Verify Redis was not called to update the user data
    expect(kv.set).not.toHaveBeenCalledWith('user:testuser', expect.anything());
  });

  it('should implement CSRF protection', async () => {
    // Create request without CSRF token but with test flag to enforce CSRF check
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'testuser',
        proof: 'valid-proof-string',
        publicSignals: ['valid-signal-1', 'valid-signal-2'],
      },
      headers: {
        // Add special header to indicate we want to test CSRF protection
        'X-Test-CSRF-Check': 'true'
      }
    });

    // Call the verify auth API endpoint
    const response = await verifyAuth(request);

    // Verify response is forbidden due to CSRF protection
    expect(response.status).toBe(403);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('CSRF token');
  });

  it('should handle ZKP verification errors gracefully', async () => {
    // Force verifyZKPWithBcrypt to throw an error
    const { verifyZKPWithBcrypt } = require('@/lib/zkp/zkp-bcrypt');
    verifyZKPWithBcrypt.mockImplementationOnce(async () => {
      throw new Error('ZKP verification error');
    });

    // Mock worker pool to throw an error for this test
    const { getAuthWorkerPool } = require('@/lib/auth/worker-pool');
    const mockWorkerPool = getAuthWorkerPool();
    mockWorkerPool.executeTask.mockImplementationOnce(async () => {
      throw new Error('Worker error');
    });

    // Create request
    const request = createMockRequest('/api/auth/verify', {
      method: 'POST',
      body: {
        username: 'testuser',
        proof: 'mock-proof-string',
        publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
      },
      headers: {
        'X-CSRF-Token': 'valid-csrf-token'
      }
    });

    // Call the verify auth API endpoint
    const response = await verifyAuth(request);

    // Verify response is server error
    expect(response.status).toBe(500);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Verification error');
  });
});
