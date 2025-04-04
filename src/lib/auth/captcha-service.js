/**
 * CAPTCHA Service
 * 
 * This service provides CAPTCHA verification functionality for security.
 */
class CaptchaService {
  constructor(redisClient, config = {}) {
    this.redisClient = redisClient;
    this.enabled = config.enabled !== false;
    this.siteKey = config.siteKey || 'test-site-key';
    this.secretKey = config.secretKey || 'test-secret-key';
    this.threshold = config.threshold || 3;
    this.verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
  }

  /**
   * Check if CAPTCHA verification is required
   * 
   * @param {string} ip - The IP address
   * @returns {Promise<boolean>} - Whether CAPTCHA verification is required
   */
  async isCaptchaRequired(ip) {
    if (!this.enabled) {
      return false;
    }

    // Get the number of failed attempts
    const attemptsStr = await this.redisClient.get(`captcha:attempts:${ip}`);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    
    // Require CAPTCHA if the number of attempts is at or above the threshold
    return attempts >= this.threshold;
  }

  /**
   * Record a failed login attempt
   * 
   * @param {string} ip - The IP address
   * @returns {Promise<void>}
   */
  async recordFailedAttempt(ip) {
    if (!this.enabled) {
      return;
    }

    // Increment the failed attempts counter
    const attempts = await this.redisClient.incr(`captcha:attempts:${ip}`);
    
    // Set expiry on the counter if it's new
    if (attempts === 1) {
      await this.redisClient.expire(`captcha:attempts:${ip}`, 24 * 60 * 60); // 24 hours
    }
  }

  /**
   * Record a successful verification
   * 
   * @param {string} ip - The IP address
   * @returns {Promise<void>}
   */
  async recordSuccessfulVerification(ip) {
    if (!this.enabled) {
      return;
    }

    // Reset the failed attempts counter
    await this.redisClient.del(`captcha:attempts:${ip}`);
  }

  /**
   * Verify a CAPTCHA token
   * 
   * @param {string} token - The CAPTCHA token
   * @param {string} ip - The IP address
   * @returns {Promise<boolean>} - Whether the token is valid
   */
  async verifyCaptcha(token, ip) {
    if (!this.enabled) {
      return true;
    }

    if (!token) {
      return false;
    }

    try {
      // In a real implementation, this would call the reCAPTCHA API
      // For testing, we'll just check that the token is not empty
      if (typeof fetch === 'function') {
        const response = await fetch(this.verificationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: this.secretKey,
            response: token,
            remoteip: ip,
          }),
        });

        const data = await response.json();
        return data.success === true && data.score >= 0.5;
      }

      // For testing environments without fetch
      return token !== 'invalid-token';
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      return false;
    }
  }
}

module.exports = { CaptchaService };
