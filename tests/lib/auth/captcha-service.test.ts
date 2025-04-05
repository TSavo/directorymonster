/**
 * CAPTCHA Service Tests
 * 
 * Tests for the CAPTCHA service implementation.
 */

import {
  getCaptchaThreshold,
  isCaptchaRequired,
  recordFailedAttemptForCaptcha,
  resetCaptchaRequirement,
  verifyCaptcha
} from '@/lib/auth/captcha-service';
import { getIpRiskLevel, RiskLevel } from '@/lib/auth/ip-blocker';
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

// Mock the IP blocker
jest.mock('@/lib/auth/ip-blocker', () => ({
  getIpRiskLevel: jest.fn(),
  RiskLevel: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
}));

// Mock fetch for CAPTCHA verification
global.fetch = jest.fn();

describe('CAPTCHA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.env
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
  });
  
  afterEach(() => {
    // Reset process.env
    delete process.env.RECAPTCHA_SECRET_KEY;
  });
  
  describe('Threshold Configuration', () => {
    it('should get the CAPTCHA threshold based on risk level', async () => {
      // Test with different risk levels
      const testCases = [
        { riskLevel: RiskLevel.LOW, expectedThreshold: 5 },
        { riskLevel: RiskLevel.MEDIUM, expectedThreshold: 2 },
        { riskLevel: RiskLevel.HIGH, expectedThreshold: 1 }
      ];
      
      for (const { riskLevel, expectedThreshold } of testCases) {
        // Mock getIpRiskLevel to return the risk level
        (getIpRiskLevel as jest.Mock).mockResolvedValue(riskLevel);
        
        // Get the CAPTCHA threshold
        const threshold = await getCaptchaThreshold('test-ip');
        
        // Check that the threshold is correct
        expect(threshold).toBe(expectedThreshold);
        
        // Check that getIpRiskLevel was called correctly
        expect(getIpRiskLevel).toHaveBeenCalledWith('test-ip');
        
        // Clear mock calls for the next test case
        jest.clearAllMocks();
      }
    });
    
    it('should handle errors when getting the threshold', async () => {
      // Mock getIpRiskLevel to throw an error
      (getIpRiskLevel as jest.Mock).mockRejectedValue(new Error('Error getting risk level'));
      
      // Get the CAPTCHA threshold
      const threshold = await getCaptchaThreshold('test-ip');
      
      // Check that the threshold is the default (3)
      expect(threshold).toBe(3);
    });
  });
  
  describe('CAPTCHA Requirement', () => {
    it('should check if CAPTCHA is required', async () => {
      // Mock Redis get to return a count
      (kv.get as jest.Mock).mockResolvedValue(3);
      
      // Mock getCaptchaThreshold to return a threshold
      jest.spyOn({ getCaptchaThreshold }, 'getCaptchaThreshold').mockResolvedValue(2);
      
      // Check if CAPTCHA is required
      const required = await isCaptchaRequired('test-ip');
      
      // Check that CAPTCHA is required
      expect(required).toBe(true);
      
      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:captcha:test-ip');
    });
    
    it('should return false if CAPTCHA is not required', async () => {
      // Mock Redis get to return a low count
      (kv.get as jest.Mock).mockResolvedValue(1);
      
      // Mock getCaptchaThreshold to return a threshold
      jest.spyOn({ getCaptchaThreshold }, 'getCaptchaThreshold').mockResolvedValue(2);
      
      // Check if CAPTCHA is required
      const required = await isCaptchaRequired('test-ip');
      
      // Check that CAPTCHA is not required
      expect(required).toBe(false);
    });
    
    it('should record a failed attempt for CAPTCHA', async () => {
      // Mock Redis get to return a count
      (kv.get as jest.Mock).mockResolvedValue(1);
      
      // Mock getCaptchaThreshold to return a threshold
      jest.spyOn({ getCaptchaThreshold }, 'getCaptchaThreshold').mockResolvedValue(3);
      
      // Record a failed attempt
      const required = await recordFailedAttemptForCaptcha('test-ip');
      
      // Check that CAPTCHA is not yet required
      expect(required).toBe(false);
      
      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith('auth:captcha:test-ip', 2);
      expect(kv.expire).toHaveBeenCalledWith('auth:captcha:test-ip', 60 * 60);
    });
    
    it('should require CAPTCHA after threshold is reached', async () => {
      // Mock Redis get to return a count at threshold
      (kv.get as jest.Mock).mockResolvedValue(2);
      
      // Mock getCaptchaThreshold to return a threshold
      jest.spyOn({ getCaptchaThreshold }, 'getCaptchaThreshold').mockResolvedValue(3);
      
      // Record a failed attempt
      const required = await recordFailedAttemptForCaptcha('test-ip');
      
      // Check that CAPTCHA is now required
      expect(required).toBe(true);
    });
    
    it('should reset CAPTCHA requirement', async () => {
      // Reset CAPTCHA requirement
      await resetCaptchaRequirement('test-ip');
      
      // Check that Redis was called correctly
      expect(kv.del).toHaveBeenCalledWith('auth:captcha:test-ip');
    });
  });
  
  describe('CAPTCHA Verification', () => {
    it('should verify a CAPTCHA token with reCAPTCHA', async () => {
      // Mock fetch to return a successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true })
      });
      
      // Mock isCaptchaRequired to return true
      jest.spyOn({ isCaptchaRequired }, 'isCaptchaRequired').mockResolvedValue(true);
      
      // Verify a CAPTCHA token
      const isValid = await verifyCaptcha('valid-token', 'test-ip');
      
      // Check that the token is valid
      expect(isValid).toBe(true);
      
      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: expect.stringContaining('secret=test-secret-key')
        })
      );
      
      // Check that Redis was called correctly for storing verification
      expect(kv.set).toHaveBeenCalledWith(
        'auth:captcha:verify:test-ip',
        expect.objectContaining({
          verifiedAt: expect.any(Number),
          token: expect.any(String)
        })
      );
      expect(kv.expire).toHaveBeenCalled();
    });
    
    it('should return true if CAPTCHA is not required', async () => {
      // Mock isCaptchaRequired to return false
      jest.spyOn({ isCaptchaRequired }, 'isCaptchaRequired').mockResolvedValue(false);
      
      // Verify a CAPTCHA token
      const isValid = await verifyCaptcha('valid-token', 'test-ip');
      
      // Check that the token is valid (CAPTCHA not required)
      expect(isValid).toBe(true);
      
      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should return false for invalid tokens', async () => {
      // Mock fetch to return a failed response
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: false })
      });
      
      // Mock isCaptchaRequired to return true
      jest.spyOn({ isCaptchaRequired }, 'isCaptchaRequired').mockResolvedValue(true);
      
      // Verify an invalid CAPTCHA token
      const isValid = await verifyCaptcha('invalid-token', 'test-ip');
      
      // Check that the token is invalid
      expect(isValid).toBe(false);
    });
    
    it('should use fallback verification if reCAPTCHA API fails', async () => {
      // Mock fetch to throw an error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // Mock isCaptchaRequired to return true
      jest.spyOn({ isCaptchaRequired }, 'isCaptchaRequired').mockResolvedValue(true);
      
      // Verify a CAPTCHA token with a long length (valid in fallback)
      const isValid = await verifyCaptcha('a-very-long-token-that-should-be-valid', 'test-ip');
      
      // Check that the token is valid (fallback verification)
      expect(isValid).toBe(true);
    });
    
    it('should use simple verification if no reCAPTCHA secret key', async () => {
      // Remove the reCAPTCHA secret key
      delete process.env.RECAPTCHA_SECRET_KEY;
      
      // Mock isCaptchaRequired to return true
      jest.spyOn({ isCaptchaRequired }, 'isCaptchaRequired').mockResolvedValue(true);
      
      // Verify a CAPTCHA token with a long length (valid in simple verification)
      const isValid = await verifyCaptcha('a-very-long-token-that-should-be-valid', 'test-ip');
      
      // Check that the token is valid (simple verification)
      expect(isValid).toBe(true);
      
      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle Redis errors when checking if CAPTCHA is required', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Check if CAPTCHA is required
      const required = await isCaptchaRequired('test-ip');
      
      // Check that CAPTCHA is not required (fail open)
      expect(required).toBe(false);
    });
    
    it('should handle Redis errors when recording failed attempts', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Record a failed attempt
      const required = await recordFailedAttemptForCaptcha('test-ip');
      
      // Check that CAPTCHA is not required (fail open)
      expect(required).toBe(false);
    });
    
    it('should handle Redis errors when resetting CAPTCHA requirement', async () => {
      // Mock Redis del to throw an error
      (kv.del as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // This should not throw an error
      await expect(resetCaptchaRequirement('test-ip')).resolves.not.toThrow();
    });
  });
});
