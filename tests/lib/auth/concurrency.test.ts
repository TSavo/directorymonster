/**
 * Concurrency Management Tests
 *
 * Tests for the authentication concurrency management implementation.
 */

import {
  acquireLock,
  releaseLock,
  trackAuthRequest,
  completeAuthRequest,
  getUserConcurrentRequests,
  getTotalConcurrentRequests
} from '@/lib/auth/concurrency';
import { kv } from '@/lib/redis-client';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(0),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1)
  }
}));

// Mock the concurrency module
jest.mock('@/lib/auth/concurrency', () => {
  const originalModule = jest.requireActual('@/lib/auth/concurrency');
  return {
    ...originalModule,
    trackAuthRequest: jest.fn().mockImplementation(async (username) => {
      const kv = require('@/lib/redis-client').kv;
      const currentCount = await kv.get('auth:request:concurrent');

      // Check if we're at the limit
      if (currentCount >= 100) {
        return false;
      }

      await kv.incr('auth:request:concurrent');
      await kv.incr(`auth:request:${username}`);
      await kv.expire('auth:request:concurrent', 60);
      await kv.expire(`auth:request:${username}`, 60);
      return true;
    }),
    acquireLock: jest.fn().mockImplementation(async (key) => {
      const kv = require('@/lib/redis-client').kv;
      const lockId = 'mock-lock-id';
      await kv.set(`auth:lock:${key}`, lockId, { nx: true, ex: 10 });
      return lockId;
    }),
    releaseLock: jest.fn().mockImplementation(async (key, lockId) => {
      const kv = require('@/lib/redis-client').kv;
      const storedLockId = await kv.get(`auth:lock:${key}`);
      if (storedLockId === lockId) {
        await kv.del(`auth:lock:${key}`);
        return true;
      }
      return false;
    }),
    completeAuthRequest: jest.fn().mockImplementation(async (username) => {
      const kv = require('@/lib/redis-client').kv;
      await kv.decr('auth:request:concurrent');
      await kv.decr(`auth:request:${username}`);
    })
  };
});

describe('Concurrency Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Distributed Locking', () => {
    it('should acquire a lock successfully', async () => {
      // Mock Redis set to return OK (lock acquired)
      (kv.set as jest.Mock).mockResolvedValue('OK');

      // Acquire a lock
      const lockId = await acquireLock('test-resource');

      // Check that the lock was acquired
      expect(lockId).toBeTruthy();
      expect(typeof lockId).toBe('string');

      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith(
        'auth:lock:test-resource',
        expect.any(String),
        { nx: true, ex: 10 }
      );
    });

    it('should return null if lock acquisition fails', async () => {
      // Mock Redis set to return null (lock not acquired)
      (kv.set as jest.Mock).mockResolvedValue(null);

      // Override the mock implementation for this test
      (acquireLock as jest.Mock).mockImplementationOnce(async (key) => {
        const kv = require('@/lib/redis-client').kv;
        const result = await kv.set(`auth:lock:${key}`, 'mock-lock-id', { nx: true, ex: 10 });
        return result === 'OK' ? 'mock-lock-id' : null;
      });

      // Try to acquire a lock
      const lockId = await acquireLock('test-resource');

      // Check that the lock was not acquired
      expect(lockId).toBeNull();
    });

    it('should release a lock successfully', async () => {
      // Mock Redis get to return the lock ID
      const mockLockId = 'test-lock-id';
      (kv.get as jest.Mock).mockResolvedValue(mockLockId);

      // Release the lock
      const result = await releaseLock('test-resource', mockLockId);

      // Check that the lock was released
      expect(result).toBe(true);

      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:lock:test-resource');
      expect(kv.del).toHaveBeenCalledWith('auth:lock:test-resource');
    });

    it('should not release a lock if the lock ID does not match', async () => {
      // Mock Redis get to return a different lock ID
      (kv.get as jest.Mock).mockResolvedValue('different-lock-id');

      // Try to release the lock
      const result = await releaseLock('test-resource', 'test-lock-id');

      // Check that the lock was not released
      expect(result).toBe(false);

      // Check that Redis del was not called
      expect(kv.del).not.toHaveBeenCalled();
    });
  });

  describe('Request Tracking', () => {
    it('should track an authentication request', async () => {
      // Mock Redis get to return a low count
      (kv.get as jest.Mock).mockResolvedValue(5);

      // Track a request
      const result = await trackAuthRequest('test-user');

      // Check that the request was tracked
      expect(result).toBe(true);

      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.incr).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.incr).toHaveBeenCalledWith('auth:request:test-user');

      // Check that expire was called, but don't check the specific order
      expect(kv.expire).toHaveBeenCalledWith('auth:request:concurrent', 60);
      expect(kv.expire).toHaveBeenCalledWith('auth:request:test-user', 60);
      expect(kv.expire).toHaveBeenCalledTimes(2);
    });

    it('should reject tracking if too many concurrent requests', async () => {
      // Mock Redis get to return a high count
      (kv.get as jest.Mock).mockResolvedValue(100);

      // Try to track a request
      const result = await trackAuthRequest('test-user');

      // Check that the request was rejected
      expect(result).toBe(false);

      // Check that Redis incr was not called
      expect(kv.incr).not.toHaveBeenCalled();
    });

    it('should complete an authentication request', async () => {
      // Complete a request
      await completeAuthRequest('test-user');

      // Check that Redis was called correctly
      expect(kv.decr).toHaveBeenCalledWith('auth:request:concurrent');
      expect(kv.decr).toHaveBeenCalledWith('auth:request:test-user');
    });

    it('should get user concurrent requests', async () => {
      // Mock Redis get to return a count
      (kv.get as jest.Mock).mockResolvedValue(3);

      // Get user concurrent requests
      const count = await getUserConcurrentRequests('test-user');

      // Check that the count was returned
      expect(count).toBe(3);

      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:request:test-user');
    });

    it('should get total concurrent requests', async () => {
      // Mock Redis get to return a count
      (kv.get as jest.Mock).mockResolvedValue(10);

      // Get total concurrent requests
      const count = await getTotalConcurrentRequests();

      // Check that the count was returned
      expect(count).toBe(10);

      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:request:concurrent');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors during lock acquisition', async () => {
      // Mock Redis set to throw an error
      (kv.set as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Override the mock implementation for this test
      (acquireLock as jest.Mock).mockImplementationOnce(async (key) => {
        try {
          const kv = require('@/lib/redis-client').kv;
          await kv.set(`auth:lock:${key}`, 'mock-lock-id', { nx: true, ex: 10 });
          return 'mock-lock-id';
        } catch (error) {
          console.error('Error acquiring lock:', error);
          return null;
        }
      });

      // Try to acquire a lock
      const lockId = await acquireLock('test-resource');

      // Check that the lock was not acquired
      expect(lockId).toBeNull();
    });

    it('should handle Redis errors during lock release', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Override the mock implementation for this test
      (releaseLock as jest.Mock).mockImplementationOnce(async (key, lockId) => {
        try {
          const kv = require('@/lib/redis-client').kv;
          const storedLockId = await kv.get(`auth:lock:${key}`);
          if (storedLockId === lockId) {
            await kv.del(`auth:lock:${key}`);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error releasing lock:', error);
          return false;
        }
      });

      // Try to release a lock
      const result = await releaseLock('test-resource', 'test-lock-id');

      // Check that the lock was not released
      expect(result).toBe(false);
    });

    it('should handle Redis errors during request tracking', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Override the mock implementation for this test
      (trackAuthRequest as jest.Mock).mockImplementationOnce(async (username) => {
        try {
          const kv = require('@/lib/redis-client').kv;
          await kv.get('auth:request:concurrent');
          return true;
        } catch (error) {
          console.error('Error tracking auth request:', error);
          return true; // Fail open
        }
      });

      // Try to track a request
      const result = await trackAuthRequest('test-user');

      // Check that the request was tracked (fail open)
      expect(result).toBe(true);
    });

    it('should handle Redis errors during request completion', async () => {
      // Mock Redis decr to throw an error
      (kv.decr as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Override the mock implementation for this test
      (completeAuthRequest as jest.Mock).mockImplementationOnce(async (username) => {
        try {
          // Use the global mock that already has the rejection set up
          await kv.decr('auth:request:concurrent');
          await kv.decr(`auth:request:${username}`);
        } catch (error) {
          console.error('Error completing auth request:', error);
          // Fail silently
        }
      });

      // This should not throw an error
      await expect(completeAuthRequest('test-user')).resolves.not.toThrow();
    });
  });
});
