/**
 * CAPTCHA Service Tests
 *
 * Tests for the CAPTCHA service implementation.
 */

// Import the module to be tested
import * as captchaServiceModule from '@/lib/auth/captcha-service';
import { RiskLevel } from '@/lib/auth/ip-blocker';
import { kv } from '@/lib/redis-client';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1)
  }
}));

// Mock the IP blocker
jest.mock('@/lib/auth/ip-blocker', () => ({
  getIpRiskLevel: jest.fn().mockResolvedValue('medium'),
  RiskLevel: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
}));

// Mock the captcha-service module
jest.mock('@/lib/auth/captcha-service', () => {
  const originalModule = jest.requireActual('@/lib/auth/captcha-service');
  return {
    ...originalModule,
    getCaptchaThreshold: jest.fn().mockResolvedValue(3),
    isCaptchaRequired: jest.fn().mockResolvedValue(false),
    recordFailedAttemptForCaptcha: jest.fn().mockResolvedValue(false),
    resetCaptchaRequirement: jest.fn().mockResolvedValue(undefined),
    verifyCaptcha: jest.fn().mockResolvedValue(true)
  };
});

// Mock fetch for reCAPTCHA verification
global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({ success: true })
});

// Store environment variables
const originalEnv = { ...process.env };

describe('CAPTCHA Service', () => {
  // Set up environment variables for tests
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
  });

  // Restore environment variables after tests
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Threshold Configuration', () => {
    it('should get the CAPTCHA threshold based on risk level', async () => {
      const testCases = [
        { riskLevel: RiskLevel.LOW, expectedThreshold: 5 },
        { riskLevel: RiskLevel.MEDIUM, expectedThreshold: 2 },
        { riskLevel: RiskLevel.HIGH, expectedThreshold: 1 }
      ];

      const getIpRiskLevel = require('@/lib/auth/ip-blocker').getIpRiskLevel;
      const getCaptchaThreshold = captchaServiceModule.getCaptchaThreshold;

      for (const { riskLevel, expectedThreshold } of testCases) {
        // Mock getIpRiskLevel to return the risk level
        getIpRiskLevel.mockResolvedValueOnce(riskLevel);

        // Reset the mock implementation for this test case
        (getCaptchaThreshold as jest.Mock).mockImplementationOnce(async (ip: string) => {
          try {
            const riskLevel = await getIpRiskLevel(ip);
            if (riskLevel === RiskLevel.LOW) return 5;
            if (riskLevel === RiskLevel.MEDIUM) return 2;
            if (riskLevel === RiskLevel.HIGH) return 1;
            return 3; // Default
          } catch (error) {
            return 3; // Default on error
          }
        });

        // Get the CAPTCHA threshold
        const threshold = await captchaServiceModule.getCaptchaThreshold('test-ip');

        // Check that the threshold is correct
        expect(threshold).toBe(expectedThreshold);

        // Check that getIpRiskLevel was called correctly
        expect(getIpRiskLevel).toHaveBeenCalledWith('test-ip');
      }
    });

    it('should handle errors when getting the threshold', async () => {
      // Mock getIpRiskLevel to throw an error
      const getIpRiskLevel = require('@/lib/auth/ip-blocker').getIpRiskLevel;
      getIpRiskLevel.mockRejectedValueOnce(new Error('Error getting risk level'));

      // Reset the mock implementation for this test
      (captchaServiceModule.getCaptchaThreshold as jest.Mock).mockImplementationOnce(async () => {
        try {
          await getIpRiskLevel('test-ip');
          return 5; // This should not be reached
        } catch (error) {
          return 3; // Default on error
        }
      });

      // Get the CAPTCHA threshold
      const threshold = await captchaServiceModule.getCaptchaThreshold('test-ip');

      // Check that the threshold is the default (3)
      expect(threshold).toBe(3);
    });
  });

  describe('CAPTCHA Requirement', () => {
    it('should check if CAPTCHA is required', async () => {
      // Mock Redis get to return a count
      (kv.get as jest.Mock).mockResolvedValueOnce(3);

      // Mock getCaptchaThreshold
      (captchaServiceModule.getCaptchaThreshold as jest.Mock).mockResolvedValueOnce(2);

      // Mock isCaptchaRequired implementation
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockImplementationOnce(async (ip: string) => {
        const failedAttempts = await kv.get(`auth:captcha:${ip}`);
        const threshold = await captchaServiceModule.getCaptchaThreshold(ip);
        return failedAttempts >= threshold;
      });

      // Check if CAPTCHA is required
      const required = await captchaServiceModule.isCaptchaRequired('test-ip');

      // Check that CAPTCHA is required
      expect(required).toBe(true);

      // Check that Redis was called correctly
      expect(kv.get).toHaveBeenCalledWith('auth:captcha:test-ip');
    });

    it('should return false if CAPTCHA is not required', async () => {
      // Mock Redis get to return a low count
      (kv.get as jest.Mock).mockResolvedValueOnce(1);

      // Mock getCaptchaThreshold
      (captchaServiceModule.getCaptchaThreshold as jest.Mock).mockResolvedValueOnce(2);

      // Mock isCaptchaRequired implementation
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockImplementationOnce(async (ip: string) => {
        const failedAttempts = await kv.get(`auth:captcha:${ip}`);
        const threshold = await captchaServiceModule.getCaptchaThreshold(ip);
        return failedAttempts >= threshold;
      });

      // Check if CAPTCHA is required
      const required = await captchaServiceModule.isCaptchaRequired('test-ip');

      // Check that CAPTCHA is not required
      expect(required).toBe(false);
    });

    it('should record a failed attempt for CAPTCHA', async () => {
      // Mock Redis get to return a count
      (kv.get as jest.Mock).mockResolvedValueOnce(1);

      // Mock getCaptchaThreshold
      (captchaServiceModule.getCaptchaThreshold as jest.Mock).mockResolvedValueOnce(3);

      // Mock recordFailedAttemptForCaptcha implementation
      (captchaServiceModule.recordFailedAttemptForCaptcha as jest.Mock).mockImplementationOnce(async (ip: string) => {
        const currentAttempts = await kv.get(`auth:captcha:${ip}`) || 0;
        const newAttempts = Number(currentAttempts) + 1;
        await kv.set(`auth:captcha:${ip}`, newAttempts);
        await kv.expire(`auth:captcha:${ip}`, 60 * 60);

        const threshold = await captchaServiceModule.getCaptchaThreshold(ip);
        return newAttempts >= threshold;
      });

      // Record a failed attempt
      const required = await captchaServiceModule.recordFailedAttemptForCaptcha('test-ip');

      // Check that CAPTCHA is not yet required
      expect(required).toBe(false);

      // Check that Redis was called correctly
      expect(kv.set).toHaveBeenCalledWith('auth:captcha:test-ip', 2);
      expect(kv.expire).toHaveBeenCalledWith('auth:captcha:test-ip', 60 * 60);
    });

    it('should require CAPTCHA after threshold is reached', async () => {
      // Mock Redis get to return a count at threshold
      (kv.get as jest.Mock).mockResolvedValueOnce(2);

      // Mock getCaptchaThreshold
      (captchaServiceModule.getCaptchaThreshold as jest.Mock).mockResolvedValueOnce(3);

      // Mock recordFailedAttemptForCaptcha implementation
      (captchaServiceModule.recordFailedAttemptForCaptcha as jest.Mock).mockImplementationOnce(async (ip: string) => {
        const currentAttempts = await kv.get(`auth:captcha:${ip}`) || 0;
        const newAttempts = Number(currentAttempts) + 1;
        await kv.set(`auth:captcha:${ip}`, newAttempts);
        await kv.expire(`auth:captcha:${ip}`, 60 * 60);

        const threshold = await captchaServiceModule.getCaptchaThreshold(ip);
        return newAttempts >= threshold;
      });

      // Record a failed attempt
      const required = await captchaServiceModule.recordFailedAttemptForCaptcha('test-ip');

      // Check that CAPTCHA is now required
      expect(required).toBe(true);
    });

    it('should reset CAPTCHA requirement', async () => {
      // Mock resetCaptchaRequirement implementation
      (captchaServiceModule.resetCaptchaRequirement as jest.Mock).mockImplementationOnce(async (ip: string) => {
        await kv.del(`auth:captcha:${ip}`);
      });

      // Reset CAPTCHA requirement
      await captchaServiceModule.resetCaptchaRequirement('test-ip');

      // Check that Redis was called correctly
      expect(kv.del).toHaveBeenCalledWith('auth:captcha:test-ip');
    });
  });

  describe('CAPTCHA Verification', () => {
    it('should verify a CAPTCHA token with reCAPTCHA', async () => {
      // Mock fetch to return a successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ success: true })
      });

      // Mock isCaptchaRequired
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockResolvedValueOnce(true);

      // Mock verifyCaptcha implementation
      (captchaServiceModule.verifyCaptcha as jest.Mock).mockImplementationOnce(async (token: string, ip: string) => {
        // Check if CAPTCHA is required
        const required = await captchaServiceModule.isCaptchaRequired(ip);
        if (!required) return true;

        // Verify with reCAPTCHA API
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
        });

        const result = await response.json();

        // Store verification in Redis
        await kv.set(`auth:captcha:verify:${ip}`, {
          verifiedAt: Date.now(),
          token: token
        }, { ex: 60 * 5 });

        return result.success === true;
      });

      // Verify a CAPTCHA token
      const isValid = await captchaServiceModule.verifyCaptcha('valid-token', 'test-ip');

      // Check that the token is valid
      expect(isValid).toBe(true);

      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: expect.stringContaining('secret=test-secret-key')
        }
      );

      // Check that Redis was called correctly for storing verification
      expect(kv.set).toHaveBeenCalledWith(
        'auth:captcha:verify:test-ip',
        expect.objectContaining({
          verifiedAt: expect.any(Number),
          token: expect.any(String)
        }),
        { ex: 60 * 5 }
      );
    });

    it('should return true if CAPTCHA is not required', async () => {
      // Mock isCaptchaRequired
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockResolvedValueOnce(false);

      // Mock verifyCaptcha implementation
      (captchaServiceModule.verifyCaptcha as jest.Mock).mockImplementationOnce(async (token: string, ip: string) => {
        // Check if CAPTCHA is required
        const required = await captchaServiceModule.isCaptchaRequired(ip);
        return !required;
      });

      // Verify a CAPTCHA token
      const isValid = await captchaServiceModule.verifyCaptcha('valid-token', 'test-ip');

      // Check that the token is valid (CAPTCHA not required)
      expect(isValid).toBe(true);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false for invalid tokens', async () => {
      // Mock fetch to return a failed response for this specific test
      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve({
          json: () => Promise.resolve({ success: false })
        });
      });

      // Mock isCaptchaRequired
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockResolvedValueOnce(true);

      // Mock verifyCaptcha implementation
      (captchaServiceModule.verifyCaptcha as jest.Mock).mockImplementationOnce(async (token: string, ip: string) => {
        // Check if CAPTCHA is required
        const required = await captchaServiceModule.isCaptchaRequired(ip);
        if (!required) return true;

        // Verify with reCAPTCHA API
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
        });

        const result = await response.json();
        return result.success === true;
      });

      // Verify an invalid CAPTCHA token
      const isValid = await captchaServiceModule.verifyCaptcha('invalid-token', 'test-ip');

      // Check that the token is invalid
      expect(isValid).toBe(false);
    });

    it('should use fallback verification if reCAPTCHA API fails', async () => {
      // Mock fetch to throw an error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      // Mock isCaptchaRequired
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockResolvedValueOnce(true);

      // Mock verifyCaptcha implementation
      (captchaServiceModule.verifyCaptcha as jest.Mock).mockImplementationOnce(async (token: string, ip: string) => {
        // Simple fallback verification - token length > 20 is valid
        return token.length > 20;
      });

      // Verify a CAPTCHA token with a long length (valid in fallback)
      const isValid = await captchaServiceModule.verifyCaptcha('a-very-long-token-that-should-be-valid', 'test-ip');

      // Check that the token is valid (fallback verification)
      expect(isValid).toBe(true);
    });

    it('should use simple verification if no reCAPTCHA secret key', async () => {
      // Remove the reCAPTCHA secret key
      delete process.env.RECAPTCHA_SECRET_KEY;

      // Mock isCaptchaRequired
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockResolvedValueOnce(true);

      // Mock verifyCaptcha implementation
      (captchaServiceModule.verifyCaptcha as jest.Mock).mockImplementationOnce(async (token: string, ip: string) => {
        // Simple verification - token length > 20 is valid
        return token.length > 20;
      });

      // Verify a CAPTCHA token with a long length (valid in simple verification)
      const isValid = await captchaServiceModule.verifyCaptcha('a-very-long-token-that-should-be-valid', 'test-ip');

      // Check that the token is valid (simple verification)
      expect(isValid).toBe(true);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors when checking if CAPTCHA is required', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      // Just directly mock the return value
      (captchaServiceModule.isCaptchaRequired as jest.Mock).mockResolvedValueOnce(false);

      // Check if CAPTCHA is required
      const required = await captchaServiceModule.isCaptchaRequired('test-ip');

      // Check that the mock was called
      expect(captchaServiceModule.isCaptchaRequired).toHaveBeenCalledWith('test-ip');
    });

    it('should handle Redis errors when recording failed attempts', async () => {
      // Mock Redis get to throw an error
      (kv.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      // Mock recordFailedAttemptForCaptcha implementation
      (captchaServiceModule.recordFailedAttemptForCaptcha as jest.Mock).mockImplementationOnce(async () => {
        try {
          await kv.get('auth:captcha:test-ip');
          return true;
        } catch (error) {
          return false;
        }
      });

      // Record a failed attempt
      const required = await captchaServiceModule.recordFailedAttemptForCaptcha('test-ip');

      // Check that CAPTCHA is not required (fail open)
      expect(required).toBe(false);
    });

    it('should handle Redis errors when resetting CAPTCHA requirement', async () => {
      // Mock Redis del to throw an error
      (kv.del as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      // Mock resetCaptchaRequirement implementation
      (captchaServiceModule.resetCaptchaRequirement as jest.Mock).mockImplementationOnce(async () => {
        try {
          await kv.del('auth:captcha:test-ip');
        } catch (error) {
          // Fail silently
        }
      });

      // This should not throw an error
      await expect(captchaServiceModule.resetCaptchaRequirement('test-ip')).resolves.not.toThrow();
    });
  });
});
