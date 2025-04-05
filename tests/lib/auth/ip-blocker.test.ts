/**
 * IP Blocker Tests
 * 
 * Tests for the IP blocking implementation with risk-based thresholds.
 */

import {
  getIpRiskLevel,
  setIpRiskLevel,
  getMaxFailedAttempts,
  getBlockDuration,
  recordFailedAttempt,
  isBlocked,
  blockIp,
  resetFailedAttempts,
  RiskLevel
} from '@/lib/auth/ip-blocker';
import { kv } from '@/lib/redis-client';
import { AuditService } from '@/lib/audit/audit-service';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    expire: jest.fn()
  }
}));

// Mock the Audit Service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: jest.fn()
  }
}));

describe('IP Blocker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Risk Level Management', () => {
    it('should get the default risk level for an IP address', async () => {
      // Mock Redis get to return null (no risk level set)
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      // Get the risk level
      const riskLevel = await getIpRiskLevel('test-ip');
      
      // Check that the risk level is the default (medium)
      expect(riskLevel).toBe(RiskLevel.MEDIUM);
      
      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:risk:test-ip');
    });
    
    it('should get the stored risk level for an IP address', async () => {
      // Mock Redis get to return a risk level
      (kv.get as jest.Mock).mockResolvedValue(RiskLevel.HIGH);
      
      // Get the risk level
      const riskLevel = await getIpRiskLevel('test-ip');
      
      // Check that the risk level is correct
      expect(riskLevel).toBe(RiskLevel.HIGH);
    });
    
    it('should set the risk level for an IP address', async () => {
      // Set the risk level
      await setIpRiskLevel('test-ip', RiskLevel.HIGH);
      
      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith('auth:risk:test-ip', RiskLevel.HIGH);
      expect(kv.expire).toHaveBeenCalledWith('auth:risk:test-ip', 30 * 24 * 60 * 60);
      
      // Check that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalled();
    });
  });
  
  describe('Threshold Configuration', () => {
    it('should get the max failed attempts based on risk level', async () => {
      // Test with different risk levels
      const testCases = [
        { riskLevel: RiskLevel.LOW, expectedThreshold: 15 },
        { riskLevel: RiskLevel.MEDIUM, expectedThreshold: 8 },
        { riskLevel: RiskLevel.HIGH, expectedThreshold: 5 }
      ];
      
      for (const { riskLevel, expectedThreshold } of testCases) {
        // Mock getIpRiskLevel to return the risk level
        jest.spyOn({ getIpRiskLevel }, 'getIpRiskLevel').mockResolvedValue(riskLevel);
        
        // Get the max failed attempts
        const maxAttempts = await getMaxFailedAttempts('test-ip');
        
        // Check that the threshold is correct
        expect(maxAttempts).toBe(expectedThreshold);
        
        // Clear mock calls for the next test case
        jest.clearAllMocks();
      }
    });
    
    it('should get the block duration based on risk level', async () => {
      // Test with different risk levels
      const testCases = [
        { riskLevel: RiskLevel.LOW, expectedDuration: 12 * 60 * 60 },
        { riskLevel: RiskLevel.MEDIUM, expectedDuration: 24 * 60 * 60 },
        { riskLevel: RiskLevel.HIGH, expectedDuration: 48 * 60 * 60 }
      ];
      
      for (const { riskLevel, expectedDuration } of testCases) {
        // Mock getIpRiskLevel to return the risk level
        jest.spyOn({ getIpRiskLevel }, 'getIpRiskLevel').mockResolvedValue(riskLevel);
        
        // Get the block duration
        const duration = await getBlockDuration('test-ip');
        
        // Check that the duration is correct
        expect(duration).toBe(expectedDuration);
        
        // Clear mock calls for the next test case
        jest.clearAllMocks();
      }
    });
  });
  
  describe('Failed Attempt Recording', () => {
    it('should record a failed attempt and not block if below threshold', async () => {
      // Mock Redis get to return a low count
      (kv.get as jest.Mock).mockResolvedValue(2);
      
      // Mock getMaxFailedAttempts to return a threshold
      jest.spyOn({ getMaxFailedAttempts }, 'getMaxFailedAttempts').mockResolvedValue(5);
      
      // Record a failed attempt
      const isNowBlocked = await recordFailedAttempt('test-ip', 'test-user', 'test-agent');
      
      // Check that the IP is not blocked
      expect(isNowBlocked).toBe(false);
      
      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith('auth:failed:test-ip', 3);
      expect(kv.expire).toHaveBeenCalled();
      
      // Check that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalled();
    });
    
    it('should record a failed attempt and block if at threshold', async () => {
      // Mock Redis get to return a count at threshold
      (kv.get as jest.Mock).mockResolvedValue(4);
      
      // Mock getMaxFailedAttempts to return a threshold
      jest.spyOn({ getMaxFailedAttempts }, 'getMaxFailedAttempts').mockResolvedValue(5);
      
      // Mock getIpRiskLevel to return a risk level
      jest.spyOn({ getIpRiskLevel }, 'getIpRiskLevel').mockResolvedValue(RiskLevel.MEDIUM);
      
      // Mock getBlockDuration to return a duration
      jest.spyOn({ getBlockDuration }, 'getBlockDuration').mockResolvedValue(24 * 60 * 60);
      
      // Mock blockIp to do nothing
      jest.spyOn({ blockIp }, 'blockIp').mockResolvedValue();
      
      // Record a failed attempt
      const isNowBlocked = await recordFailedAttempt('test-ip', 'test-user', 'test-agent');
      
      // Check that the IP is now blocked
      expect(isNowBlocked).toBe(true);
    });
  });
  
  describe('IP Blocking', () => {
    it('should check if an IP is blocked', async () => {
      // Mock Redis get to return a block record
      (kv.get as jest.Mock).mockResolvedValue({
        blockedAt: Date.now(),
        reason: 'Too many failed login attempts'
      });
      
      // Check if the IP is blocked
      const blocked = await isBlocked('test-ip');
      
      // Check that the IP is blocked
      expect(blocked).toBe(true);
      
      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:blocked:test-ip');
    });
    
    it('should return false if an IP is not blocked', async () => {
      // Mock Redis get to return null
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      // Check if the IP is blocked
      const blocked = await isBlocked('test-ip');
      
      // Check that the IP is not blocked
      expect(blocked).toBe(false);
    });
    
    it('should block an IP address', async () => {
      // Mock getIpRiskLevel to return a risk level
      jest.spyOn({ getIpRiskLevel }, 'getIpRiskLevel').mockResolvedValue(RiskLevel.MEDIUM);
      
      // Mock getBlockDuration to return a duration
      jest.spyOn({ getBlockDuration }, 'getBlockDuration').mockResolvedValue(24 * 60 * 60);
      
      // Mock Redis keys to return user keys
      (kv.keys as jest.Mock).mockResolvedValue(['user:1']);
      
      // Mock Redis get for user lookup
      (kv.get as jest.Mock).mockResolvedValue({
        id: 'user-1',
        username: 'test-user'
      });
      
      // Block the IP
      await blockIp('test-ip', 'test-user', 'test-agent');
      
      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith(
        'auth:blocked:test-ip',
        expect.objectContaining({
          blockedAt: expect.any(Number),
          reason: 'Too many failed login attempts',
          username: 'test-user',
          userAgent: 'test-agent',
          riskLevel: RiskLevel.MEDIUM,
          blockDuration: 24 * 60 * 60
        })
      );
      expect(kv.expire).toHaveBeenCalledWith('auth:blocked:test-ip', 24 * 60 * 60);
      
      // Check that the audit service was called
      expect(AuditService.logEvent).toHaveBeenCalled();
    });
    
    it('should reset failed attempts for an IP address', async () => {
      // Reset failed attempts
      await resetFailedAttempts('test-ip');
      
      // Check that Redis was called correctly
      expect(kv.del).toHaveBeenCalledWith('auth:failed:test-ip');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle Redis errors when getting risk level', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Get the risk level
      const riskLevel = await getIpRiskLevel('test-ip');
      
      // Check that the risk level is the default (medium)
      expect(riskLevel).toBe(RiskLevel.MEDIUM);
    });
    
    it('should handle Redis errors when setting risk level', async () => {
      // Mock Redis set to throw an error
      (kv.set as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // This should not throw an error
      await expect(setIpRiskLevel('test-ip', RiskLevel.HIGH)).resolves.not.toThrow();
    });
    
    it('should handle Redis errors when recording failed attempts', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Record a failed attempt
      const isNowBlocked = await recordFailedAttempt('test-ip', 'test-user', 'test-agent');
      
      // Check that the IP is not blocked (fail closed)
      expect(isNowBlocked).toBe(false);
    });
  });
});
