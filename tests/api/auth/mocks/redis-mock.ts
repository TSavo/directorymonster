/**
 * Redis mock for authentication tests
 */

// Mock user data
export const mockUsers = {
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

// Mock rate limit data
export const mockRateLimits = {
  'ratelimit:login:testuser': 5, // 5 failed attempts
};

/**
 * Setup Redis mock for authentication tests
 */
export function setupRedisMock() {
  // Create a mock implementation for kv.get
  const mockGet = jest.fn().mockImplementation(async (key: string) => {
    // Return user data
    if (key.startsWith('user:')) {
      const username = key.replace('user:', '');
      return mockUsers[username] || null;
    }

    // Return rate limit data
    if (key.startsWith('ratelimit:')) {
      return mockRateLimits[key] || null;
    }

    return null;
  });

  // Mock the Redis client
  jest.mock('@/lib/redis-client', () => {
    // Store the original module to restore when needed
    const originalModule = jest.requireActual('@/lib/redis-client');

    return {
      ...originalModule,
      kv: {
        ...originalModule.kv,
        get: mockGet,
        set: jest.fn().mockResolvedValue('OK'),
        keys: jest.fn().mockResolvedValue([]),
        del: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1), // Mock expire function to return success
      },
      redis: {
        ...originalModule.redis,
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
}

/**
 * Reset Redis mock for authentication tests
 */
export function resetRedisMock() {
  // Reset the mock implementation
  const { kv } = require('@/lib/redis-client');

  // Configure Redis mock to return user data
  (kv.get as jest.Mock).mockImplementation(async (key: string) => {
    // Return user data
    if (key.startsWith('user:')) {
      const username = key.replace('user:', '');
      return mockUsers[username] || null;
    }

    // Return rate limit data
    if (key.startsWith('ratelimit:')) {
      return mockRateLimits[key] || null;
    }

    return null;
  });

  // Reset other mocks
  (kv.set as jest.Mock).mockResolvedValue('OK');
  (kv.keys as jest.Mock).mockResolvedValue([]);
  (kv.del as jest.Mock).mockResolvedValue(1);
  (kv.expire as jest.Mock).mockResolvedValue(1);
}
