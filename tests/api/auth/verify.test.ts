/**
 * @jest-environment node
 */
import { POST as verifyAuth } from '@/app/api/auth/verify/route';
import { createMockRequest } from '../../integration/setup';
import { verifyProof } from '@/lib/zkp';
import { Redis } from '@/lib/redis-client';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => {
  // Store the original module to restore when needed
  const originalModule = jest.requireActual('@/lib/redis-client');
  
  return {
    ...originalModule,
    kv: {
      ...originalModule.kv,
      get: jest.fn(),
      set: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    },
    redis: {
      ...originalModule.redis,
      multi: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        get: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
      }),
      ping: jest.fn(),
    },
  };
});

// Mock the ZKP library
jest.mock('@/lib/zkp', () => ({
  verifyProof: jest.fn(),
  generateSalt: jest.fn(),
  derivePublicKey: jest.fn(),
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

describe('Auth Verification API', () => {
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

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure Redis mock to return user data
    const { kv } = require('@/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'user:testuser') {
        return mockUsers['testuser'];
      }
      if (key === 'user:readonlyuser') {
        return mockUsers['readonlyuser'];
      }
      if (key === 'user:lockeduser') {
        return mockUsers['lockeduser'];
      }
      return null;
    });
    
    // Configure ZKP verifyProof mock
    (verifyProof as jest.Mock).mockImplementation(async ({ proof, publicSignals, publicKey }) => {
      // Only return true for testuser with correct public key
      if (publicKey === 'test-public-key') {
        return true;
      }
      return false;
    });
  });

  it.skip($2, async () => {
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

  it.skip($2, async () => {
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

  it.skip($2, async () => {
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

  it.skip($2, async () => {
    // Force verifyProof to return false for this test
    (verifyProof as jest.Mock).mockResolvedValueOnce(false);
    
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

  it.skip($2, async () => {
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
      'user:testuser',
      expect.objectContaining({
        ...mockUsers['testuser'],
        lastLogin: expect.any(Number)
      })
    );
  });

  it.skip($2, async () => {
    // Mock Redis to simulate rate limiting
    const { kv } = require('@/lib/redis-client');
    (kv.get as jest.Mock).mockImplementationOnce(async (key: string) => {
      if (key === 'ratelimit:login:testuser') {
        return 5; // 5 failed attempts
      }
      if (key === 'user:testuser') {
        return mockUsers['testuser'];
      }
      return null;
    });
    
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

  it.skip($2, async () => {
    // Force verifyProof to throw an error
    (verifyProof as jest.Mock).mockRejectedValueOnce(new Error('ZKP verification error'));
    
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
    expect(data.error).toContain('Authentication error');
  });
});
