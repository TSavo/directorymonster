/**
 * Progressive Delay Tests
 * 
 * Tests for the progressive delay implementation with exponential backoff.
 */

import {
  getProgressiveDelay,
  recordFailedAttemptForDelay,
  resetDelay
} from '@/lib/auth/progressive-delay';
import { kv } from '@/lib/redis-client';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    expire: jest.fn()
  }
}));

// Mock Math.random for predictable jitter
const originalRandom = Math.random;
jest.spyOn(Math, 'random').mockImplementation(() => 0.5);

describe('Progressive Delay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore original Math.random
    (Math.random as jest.Mock).mockImplementation(originalRandom);
  });
  
  describe('getProgressiveDelay', () => {
    it('should return 0 for no failed attempts', async () => {
      // Mock Redis get to return 0
      (kv.get as jest.Mock).mockResolvedValue(0);
      
      // Get the delay
      const delay = await getProgressiveDelay('test-ip');
      
      // Check that the delay is 0
      expect(delay).toBe(0);
      
      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:delay:test-ip');
    });
    
    it('should return base delay for first failed attempt', async () => {
      // Mock Redis get to return 1
      (kv.get as jest.Mock).mockResolvedValue(1);
      
      // Get the delay
      const delay = await getProgressiveDelay('test-ip');
      
      // Check that the delay is the base delay (1000ms)
      expect(delay).toBe(1000);
    });
    
    it('should apply exponential backoff for multiple failed attempts', async () => {
      // Test with different numbers of failed attempts
      const testCases = [
        { attempts: 2, expectedBaseDelay: 2000 },  // 1000 * 2^1
        { attempts: 3, expectedBaseDelay: 4000 },  // 1000 * 2^2
        { attempts: 4, expectedBaseDelay: 8000 },  // 1000 * 2^3
        { attempts: 5, expectedBaseDelay: 16000 }, // 1000 * 2^4
        { attempts: 6, expectedBaseDelay: 32000 }, // 1000 * 2^5
        { attempts: 7, expectedBaseDelay: 60000 }  // Max delay (capped)
      ];
      
      for (const { attempts, expectedBaseDelay } of testCases) {
        // Mock Redis get to return the number of attempts
        (kv.get as jest.Mock).mockResolvedValue(attempts);
        
        // Get the delay
        const delay = await getProgressiveDelay('test-ip');
        
        // Check that the delay is correct with jitter
        // With our mocked Math.random = 0.5, jitter should be 0
        expect(delay).toBe(expectedBaseDelay);
        
        // Check that Redis was called correctly
        expect(kv.get).toHaveBeenCalledWith('auth:delay:test-ip');
        
        // Clear mock calls for the next test case
        jest.clearAllMocks();
      }
    });
    
    it('should apply jitter to the delay', async () => {
      // Mock Redis get to return 3 attempts
      (kv.get as jest.Mock).mockResolvedValue(3);
      
      // Mock Math.random to return different values
      (Math.random as jest.Mock)
        .mockReturnValueOnce(0)    // Minimum jitter
        .mockReturnValueOnce(1)    // Maximum jitter
        .mockReturnValueOnce(0.5); // Middle jitter
      
      // Base delay for 3 attempts is 4000ms
      // Jitter range is 4000 * 0.1 = 400ms
      
      // Get the delay with minimum jitter
      const minJitterDelay = await getProgressiveDelay('test-ip');
      // Expected: 4000 - 400 = 3600ms
      expect(minJitterDelay).toBe(3600);
      
      // Get the delay with maximum jitter
      const maxJitterDelay = await getProgressiveDelay('test-ip');
      // Expected: 4000 + 400 = 4400ms
      expect(maxJitterDelay).toBe(4400);
      
      // Get the delay with middle jitter
      const midJitterDelay = await getProgressiveDelay('test-ip');
      // Expected: 4000 + 0 = 4000ms
      expect(midJitterDelay).toBe(4000);
    });
    
    it('should handle Redis errors', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Get the delay
      const delay = await getProgressiveDelay('test-ip');
      
      // Check that the delay is 0 (fail open)
      expect(delay).toBe(0);
    });
  });
  
  describe('recordFailedAttemptForDelay', () => {
    it('should record a failed attempt and return the new delay', async () => {
      // Mock Redis get to return 1 (for current attempts)
      (kv.get as jest.Mock).mockResolvedValue(1);
      
      // Record a failed attempt
      const delay = await recordFailedAttemptForDelay('test-ip');
      
      // Check that the delay is correct for 2 attempts
      expect(delay).toBe(2000);
      
      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:delay:test-ip');
      expect(kv.set).toHaveBeenCalledWith('auth:delay:test-ip', 2);
      expect(kv.expire).toHaveBeenCalledWith('auth:delay:test-ip', 3600);
    });
    
    it('should handle first failed attempt', async () => {
      // Mock Redis get to return null (no previous attempts)
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      // Record a failed attempt
      const delay = await recordFailedAttemptForDelay('test-ip');
      
      // Check that the delay is correct for 1 attempt
      expect(delay).toBe(1000);
      
      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith('auth:delay:test-ip', 1);
    });
    
    it('should handle Redis errors', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Record a failed attempt
      const delay = await recordFailedAttemptForDelay('test-ip');
      
      // Check that the delay is 0 (fail open)
      expect(delay).toBe(0);
    });
  });
  
  describe('resetDelay', () => {
    it('should reset the delay for an IP address', async () => {
      // Reset the delay
      await resetDelay('test-ip');
      
      // Check that Redis was called correctly
      expect(kv.del).toHaveBeenCalledWith('auth:delay:test-ip');
    });
    
    it('should handle Redis errors', async () => {
      // Mock Redis del to throw an error
      (kv.del as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // This should not throw an error
      await expect(resetDelay('test-ip')).resolves.not.toThrow();
    });
  });
});
