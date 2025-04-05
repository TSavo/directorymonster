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
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    expire: jest.fn()
  }
}));

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
      
      // Try to acquire a lock
      const lockId = await acquireLock('test-resource');
      
      // Check that the lock was not acquired
      expect(lockId).toBeNull();
    });
    
    it('should handle Redis errors during lock release', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Try to release a lock
      const result = await releaseLock('test-resource', 'test-lock-id');
      
      // Check that the lock was not released
      expect(result).toBe(false);
    });
    
    it('should handle Redis errors during request tracking', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Try to track a request
      const result = await trackAuthRequest('test-user');
      
      // Check that the request was tracked (fail open)
      expect(result).toBe(true);
    });
    
    it('should handle Redis errors during request completion', async () => {
      // Mock Redis decr to throw an error
      (kv.decr as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // This should not throw an error
      await expect(completeAuthRequest('test-user')).resolves.not.toThrow();
    });
  });
});
