// ZKP Authentication Security Measures Tests
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import the ZKP functions from the application
const { generateProof, verifyProof } = require('../../src/lib/zkp');

// Import the security services
const { IpBlocker } = require('../../src/lib/auth/ip-blocker');
const { CaptchaService } = require('../../src/lib/auth/captcha-service');
const { AuditService } = require('../../src/lib/auth/audit-service');

describe('ZKP Authentication Security Measures Tests', () => {
  // Mock Redis client
  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
  };

  // Mock configuration
  const mockConfig = {
    ipBlocker: {
      maxFailedAttempts: 5,
      blockDuration: 15 * 60, // 15 minutes in seconds
      adminUsername: 'admin',
    },
    captcha: {
      enabled: true,
      siteKey: 'test-site-key',
      secretKey: 'test-secret-key',
      threshold: 3,
    },
    audit: {
      enabled: true,
      logLevel: 'info',
    },
  };

  // Test data
  const testIp = '192.168.1.1';
  const testUsername = 'testuser';
  const testPassword = 'Password123!';
  const testSalt = 'randomsalt123';

  // Initialize services
  let ipBlocker;
  let captchaService;
  let auditService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize services with mocks
    ipBlocker = new IpBlocker(mockRedisClient, mockConfig.ipBlocker);
    captchaService = new CaptchaService(mockRedisClient, mockConfig.captcha);
    auditService = new AuditService(mockConfig.audit);

    // Mock audit service log method
    auditService.log = jest.fn();

    // Mock Redis client methods
    mockRedisClient.get.mockImplementation((key) => {
      if (key === `ip:block:${testIp}`) {
        return Promise.resolve(null); // Not blocked by default
      }
      if (key === `ip:attempts:${testIp}`) {
        return Promise.resolve('0'); // No attempts by default
      }
      return Promise.resolve(null);
    });

    mockRedisClient.incr.mockImplementation((key) => {
      if (key === `ip:attempts:${testIp}`) {
        return Promise.resolve(1); // Increment to 1
      }
      return Promise.resolve(1);
    });

    mockRedisClient.exists.mockResolvedValue(0); // Key doesn't exist by default
    mockRedisClient.set.mockResolvedValue('OK');
    mockRedisClient.expire.mockResolvedValue(1);
  });

  describe('IP Blocking', () => {
    it('should block an IP after too many failed login attempts', async () => {
      // Mock Redis to return high attempt count
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `ip:attempts:${testIp}`) {
          return Promise.resolve(mockConfig.ipBlocker.maxFailedAttempts.toString());
        }
        return Promise.resolve(null);
      });

      // Mock Redis incr to return a value above the threshold
      mockRedisClient.incr.mockResolvedValue(mockConfig.ipBlocker.maxFailedAttempts + 1);

      // Check if IP is blocked
      const isBlocked = await ipBlocker.isBlocked(testIp);
      expect(isBlocked).toBe(false);

      // Record a failed attempt
      await ipBlocker.recordFailedAttempt(testIp);

      // Verify Redis calls
      expect(mockRedisClient.incr).toHaveBeenCalledWith(`ip:attempts:${testIp}`);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `ip:block:${testIp}`,
        '1',
        'EX',
        mockConfig.ipBlocker.blockDuration
      );
    });

    it('should not block an IP with few failed attempts', async () => {
      // Mock Redis to return low attempt count
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `ip:attempts:${testIp}`) {
          return Promise.resolve('2'); // Below threshold
        }
        return Promise.resolve(null);
      });

      // Check if IP is blocked
      const isBlocked = await ipBlocker.isBlocked(testIp);
      expect(isBlocked).toBe(false);

      // Record a failed attempt
      await ipBlocker.recordFailedAttempt(testIp);

      // Verify Redis calls
      expect(mockRedisClient.incr).toHaveBeenCalledWith(`ip:attempts:${testIp}`);
      expect(mockRedisClient.set).not.toHaveBeenCalledWith(
        `ip:block:${testIp}`,
        '1',
        'EX',
        expect.any(Number)
      );
    });

    it('should reset failed attempts after successful login', async () => {
      // Record a successful login
      await ipBlocker.recordSuccessfulLogin(testIp);

      // Verify Redis calls
      expect(mockRedisClient.del).toHaveBeenCalledWith(`ip:attempts:${testIp}`);
    });

    it('should allow admin users to bypass IP blocking', async () => {
      // Mock Redis to return blocked status
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `ip:block:${testIp}`) {
          return Promise.resolve('1'); // IP is blocked
        }
        return Promise.resolve(null);
      });

      // Check if IP is blocked for regular user
      const isBlockedForRegularUser = await ipBlocker.isBlocked(testIp);
      expect(isBlockedForRegularUser).toBe(true);

      // Check if IP is blocked for admin user
      const isBlockedForAdmin = await ipBlocker.isBlocked(testIp, { username: mockConfig.ipBlocker.adminUsername });
      expect(isBlockedForAdmin).toBe(false);
    });
  });

  describe('CAPTCHA Verification', () => {
    it('should require CAPTCHA after threshold failed attempts', async () => {
      // Mock Redis to return attempt count at threshold
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `captcha:attempts:${testIp}`) {
          return Promise.resolve(mockConfig.captcha.threshold.toString());
        }
        return Promise.resolve(null);
      });

      // Check if CAPTCHA is required
      const isCaptchaRequired = await captchaService.isCaptchaRequired(testIp);
      expect(isCaptchaRequired).toBe(true);
    });

    it('should not require CAPTCHA with few failed attempts', async () => {
      // Mock Redis to return low attempt count
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `captcha:attempts:${testIp}`) {
          return Promise.resolve('1'); // Below threshold
        }
        return Promise.resolve(null);
      });

      // Check if CAPTCHA is required
      const isCaptchaRequired = await captchaService.isCaptchaRequired(testIp);
      expect(isCaptchaRequired).toBe(false);
    });

    it('should record failed attempts for CAPTCHA tracking', async () => {
      // Record a failed attempt
      await captchaService.recordFailedAttempt(testIp);

      // Verify Redis calls
      expect(mockRedisClient.incr).toHaveBeenCalledWith(`captcha:attempts:${testIp}`);
      expect(mockRedisClient.expire).toHaveBeenCalledWith(`captcha:attempts:${testIp}`, expect.any(Number));
    });

    it('should reset CAPTCHA requirement after successful verification', async () => {
      // Record a successful verification
      await captchaService.recordSuccessfulVerification(testIp);

      // Verify Redis calls
      expect(mockRedisClient.del).toHaveBeenCalledWith(`captcha:attempts:${testIp}`);
    });

    it('should validate CAPTCHA tokens', async () => {
      // Mock the verification API call
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () => Promise.resolve({ success: true, score: 0.9 }),
        })
      );

      // Create a mock URLSearchParams
      global.URLSearchParams = jest.fn().mockImplementation(() => ({
        toString: () => 'secret=test-secret-key&response=valid-token&remoteip=192.168.1.1'
      }));

      // Verify a valid token
      const isValid = await captchaService.verifyCaptcha('valid-token', testIp);
      expect(isValid).toBe(true);

      // Verify fetch was called with the right parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google.com/recaptcha/api/siteverify'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(Object),
        })
      );

      // Clean up
      delete global.fetch;
      delete global.URLSearchParams;
    });
  });

  describe('Audit Logging', () => {
    it('should log authentication attempts', async () => {
      // Log a successful authentication
      auditService.logAuthenticationAttempt({
        username: testUsername,
        ip: testIp,
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Verify log was called
      expect(auditService.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('Authentication successful'),
        expect.objectContaining({
          username: testUsername,
          ip: testIp,
          success: true,
        })
      );

      // Log a failed authentication
      auditService.logAuthenticationAttempt({
        username: testUsername,
        ip: testIp,
        success: false,
        timestamp: new Date().toISOString(),
        reason: 'Invalid credentials',
      });

      // Verify log was called
      expect(auditService.log).toHaveBeenCalledWith(
        'warn',
        expect.stringContaining('Authentication failed'),
        expect.objectContaining({
          username: testUsername,
          ip: testIp,
          success: false,
          reason: 'Invalid credentials',
        })
      );
    });

    it('should log security events', async () => {
      // Log an IP blocking event
      auditService.logSecurityEvent({
        type: 'IP_BLOCKED',
        ip: testIp,
        reason: 'Too many failed attempts',
        timestamp: new Date().toISOString(),
      });

      // Verify log was called
      expect(auditService.log).toHaveBeenCalledWith(
        'warn',
        expect.stringContaining('Security event: IP_BLOCKED'),
        expect.objectContaining({
          type: 'IP_BLOCKED',
          ip: testIp,
          reason: 'Too many failed attempts',
        })
      );
    });

    it('should log ZKP verification events', async () => {
      // Log a successful ZKP verification
      auditService.logZkpVerification({
        username: testUsername,
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Verify log was called
      expect(auditService.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('ZKP verification successful'),
        expect.objectContaining({
          username: testUsername,
          success: true,
        })
      );

      // Log a failed ZKP verification
      auditService.logZkpVerification({
        username: testUsername,
        success: false,
        timestamp: new Date().toISOString(),
        reason: 'Invalid proof',
      });

      // Verify log was called
      expect(auditService.log).toHaveBeenCalledWith(
        'warn',
        expect.stringContaining('ZKP verification failed'),
        expect.objectContaining({
          username: testUsername,
          success: false,
          reason: 'Invalid proof',
        })
      );
    });
  });

  describe('Progressive Delays', () => {
    it('should implement progressive delays for failed login attempts', async () => {
      // Mock Redis to return different attempt counts
      let attemptCount = 0;
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `ip:attempts:${testIp}`) {
          return Promise.resolve(attemptCount.toString());
        }
        return Promise.resolve(null);
      });

      // Test with increasing attempt counts
      for (let i = 1; i <= 5; i++) {
        attemptCount = i;
        const delay = await ipBlocker.getProgressiveDelay(testIp);

        // Verify delay increases with attempt count
        // Typical implementation might use exponential backoff: delay = baseDelay * 2^(attemptCount-1)
        const expectedDelay = 1000 * Math.pow(2, i - 1); // 1s, 2s, 4s, 8s, 16s
        expect(delay).toBeGreaterThanOrEqual(i * 1000); // At minimum, delay should increase linearly
      }
    });

    it('should reset progressive delays after successful login', async () => {
      // Record a successful login
      await ipBlocker.recordSuccessfulLogin(testIp);

      // Verify Redis calls to reset attempts
      expect(mockRedisClient.del).toHaveBeenCalledWith(`ip:attempts:${testIp}`);

      // Check that delay is reset to 0
      mockRedisClient.get.mockResolvedValue('0');
      const delay = await ipBlocker.getProgressiveDelay(testIp);
      expect(delay).toBe(0);
    });
  });

  describe('Integration with ZKP Authentication', () => {
    // Mock authentication service
    let authService;

    beforeEach(() => {
      // Set up mock authentication service
      authService = {
        authenticate: async (username, password, ip, captchaToken = null) => {
          // Check if IP is blocked
          const isBlocked = await ipBlocker.isBlocked(ip);
          if (isBlocked) {
            auditService.logSecurityEvent({
              type: 'BLOCKED_IP_ATTEMPT',
              ip,
              username,
              timestamp: new Date().toISOString(),
            });
            return { success: false, error: 'IP address is blocked' };
          }

          // Check if CAPTCHA is required
          const isCaptchaRequired = await captchaService.isCaptchaRequired(ip);
          if (isCaptchaRequired && !captchaToken) {
            auditService.logSecurityEvent({
              type: 'CAPTCHA_REQUIRED',
              ip,
              username,
              timestamp: new Date().toISOString(),
            });
            return { success: false, error: 'CAPTCHA verification required', captchaRequired: true };
          }

          // Verify CAPTCHA if provided
          if (captchaToken) {
            const isValidCaptcha = await captchaService.verifyCaptcha(captchaToken, ip);
            if (!isValidCaptcha) {
              auditService.logSecurityEvent({
                type: 'INVALID_CAPTCHA',
                ip,
                username,
                timestamp: new Date().toISOString(),
              });
              return { success: false, error: 'Invalid CAPTCHA' };
            }
          }

          // Apply progressive delay
          const delay = await ipBlocker.getProgressiveDelay(ip);
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          try {
            // Generate a proof for the test user
            const { proof, publicSignals } = await generateProof(
              username,
              password,
              testSalt
            );

            // For testing purposes, we'll simulate a failed verification for specific credentials
            if (username === 'failuser' || password === 'failpassword') {
              proof.protocol = 'wrong_password';
            }

            // Verify the proof
            let isValid = false;
            try {
              isValid = await verifyProof(proof, publicSignals);
            } catch (error) {
              isValid = false;
            }

            if (isValid) {
              // Record successful login
              await ipBlocker.recordSuccessfulLogin(ip);
              await captchaService.recordSuccessfulVerification(ip);

              // Log successful authentication
              auditService.logAuthenticationAttempt({
                username,
                ip,
                success: true,
                timestamp: new Date().toISOString(),
              });

              // Generate a token
              const token = 'valid-jwt-token-' + Math.random().toString(36).substring(2);
              return { success: true, token };
            } else {
              // Record failed attempt
              await ipBlocker.recordFailedAttempt(ip);
              await captchaService.recordFailedAttempt(ip);

              // Log failed authentication
              auditService.logAuthenticationAttempt({
                username,
                ip,
                success: false,
                reason: 'Invalid proof',
                timestamp: new Date().toISOString(),
              });

              return { success: false, error: 'Invalid credentials' };
            }
          } catch (error) {
            // Record failed attempt
            await ipBlocker.recordFailedAttempt(ip);
            await captchaService.recordFailedAttempt(ip);

            // Log error
            auditService.logAuthenticationAttempt({
              username,
              ip,
              success: false,
              reason: error.message,
              timestamp: new Date().toISOString(),
            });

            return { success: false, error: 'Authentication error' };
          }
        }
      };
    });

    it('should authenticate successfully with valid credentials', async () => {
      // Attempt to authenticate
      const result = await authService.authenticate(testUsername, testPassword, testIp);

      // Verify result
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('token');

      // Verify services were called
      expect(mockRedisClient.del).toHaveBeenCalledWith(`ip:attempts:${testIp}`);
      expect(mockRedisClient.del).toHaveBeenCalledWith(`captcha:attempts:${testIp}`);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should reject authentication with invalid credentials', async () => {
      // Attempt to authenticate with invalid credentials
      const result = await authService.authenticate('failuser', testPassword, testIp);

      // Verify result
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');

      // Verify services were called
      expect(mockRedisClient.incr).toHaveBeenCalledWith(`ip:attempts:${testIp}`);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(`captcha:attempts:${testIp}`);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should require CAPTCHA after multiple failed attempts', async () => {
      // Mock Redis to return attempt count at threshold
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `captcha:attempts:${testIp}`) {
          return Promise.resolve(mockConfig.captcha.threshold.toString());
        }
        if (key === `ip:block:${testIp}`) {
          return Promise.resolve(null); // Not blocked
        }
        if (key === `ip:attempts:${testIp}`) {
          return Promise.resolve('0'); // No IP attempts
        }
        return Promise.resolve('0');
      });

      // Mock isBlocked to return false
      const originalIsBlocked = ipBlocker.isBlocked;
      ipBlocker.isBlocked = jest.fn().mockResolvedValue(false);

      try {
        // Attempt to authenticate without CAPTCHA
        const result = await authService.authenticate(testUsername, testPassword, testIp);

        // Verify result
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(false);
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('captchaRequired');
        expect(result.captchaRequired).toBe(true);

        // Verify services were called
        expect(auditService.log).toHaveBeenCalled();
      } finally {
        // Restore original method
        ipBlocker.isBlocked = originalIsBlocked;
      }
    });

    it('should block IP after too many failed attempts', async () => {
      // Mock Redis to return high attempt count
      mockRedisClient.get.mockImplementation((key) => {
        if (key === `ip:attempts:${testIp}`) {
          return Promise.resolve(mockConfig.ipBlocker.maxFailedAttempts.toString());
        }
        if (key === `ip:block:${testIp}`) {
          return Promise.resolve('1'); // IP is blocked
        }
        return Promise.resolve('0');
      });

      // Attempt to authenticate
      const result = await authService.authenticate(testUsername, testPassword, testIp);

      // Verify result
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('IP address is blocked');

      // Verify services were called
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should apply progressive delays for failed attempts', async () => {
      // Mock getProgressiveDelay to return a delay
      const originalGetProgressiveDelay = ipBlocker.getProgressiveDelay;
      ipBlocker.getProgressiveDelay = jest.fn().mockResolvedValue(100); // 100ms delay

      // Attempt to authenticate
      const startTime = Date.now();
      await authService.authenticate('failuser', testPassword, testIp);
      const endTime = Date.now();

      // Verify delay was applied
      expect(ipBlocker.getProgressiveDelay).toHaveBeenCalledWith(testIp);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);

      // Restore original method
      ipBlocker.getProgressiveDelay = originalGetProgressiveDelay;
    });
  });
});
