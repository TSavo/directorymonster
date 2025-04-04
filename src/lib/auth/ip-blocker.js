/**
 * IP Blocker Service
 * 
 * This service provides IP-based blocking functionality for security.
 */
class IpBlocker {
  constructor(redisClient, config = {}) {
    this.redisClient = redisClient;
    this.maxFailedAttempts = config.maxFailedAttempts || 5;
    this.blockDuration = config.blockDuration || 15 * 60; // 15 minutes in seconds
    this.adminUsername = config.adminUsername || 'admin';
  }

  /**
   * Check if an IP address is blocked
   * 
   * @param {string} ip - The IP address to check
   * @param {object} options - Additional options
   * @param {string} options.username - The username (for admin bypass)
   * @returns {Promise<boolean>} - Whether the IP is blocked
   */
  async isBlocked(ip, options = {}) {
    // Admin users can bypass IP blocking
    if (options.username === this.adminUsername) {
      return false;
    }

    // Check if the IP is blocked
    const blocked = await this.redisClient.get(`ip:block:${ip}`);
    return blocked !== null;
  }

  /**
   * Record a failed login attempt
   * 
   * @param {string} ip - The IP address
   * @returns {Promise<void>}
   */
  async recordFailedAttempt(ip) {
    // Increment the failed attempts counter
    const attempts = await this.redisClient.incr(`ip:attempts:${ip}`);
    
    // Set expiry on the counter if it's new
    if (attempts === 1) {
      await this.redisClient.expire(`ip:attempts:${ip}`, 24 * 60 * 60); // 24 hours
    }
    
    // Block the IP if too many failed attempts
    if (attempts >= this.maxFailedAttempts) {
      await this.redisClient.set(`ip:block:${ip}`, '1', 'EX', this.blockDuration);
    }
  }

  /**
   * Record a successful login
   * 
   * @param {string} ip - The IP address
   * @returns {Promise<void>}
   */
  async recordSuccessfulLogin(ip) {
    // Reset the failed attempts counter
    await this.redisClient.del(`ip:attempts:${ip}`);
  }

  /**
   * Get the progressive delay for an IP address
   * 
   * @param {string} ip - The IP address
   * @returns {Promise<number>} - The delay in milliseconds
   */
  async getProgressiveDelay(ip) {
    // Get the number of failed attempts
    const attemptsStr = await this.redisClient.get(`ip:attempts:${ip}`);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    
    // No delay for the first attempt
    if (attempts === 0) {
      return 0;
    }
    
    // Exponential backoff: delay = 1000 * 2^(attempts-1) ms
    // 1s, 2s, 4s, 8s, 16s, ...
    return 1000 * Math.pow(2, attempts - 1);
  }
}

module.exports = { IpBlocker };
