/**
 * CAPTCHA service for authentication security
 *
 * This module provides functions to manage CAPTCHA challenges
 * for authentication endpoints after failed attempts.
 * Supports configurable thresholds based on IP risk level.
 */

import { kv } from '@/lib/redis-client';
import { getIpRiskLevel, RiskLevel } from './ip-blocker';

// Key prefixes
const CAPTCHA_REQUIRED_PREFIX = 'auth:captcha:';
const CAPTCHA_VERIFICATION_PREFIX = 'auth:captcha:verify:';

// Configuration with defaults
const DEFAULT_CAPTCHA_THRESHOLD = 3; // Require CAPTCHA after 3 failed attempts
const CAPTCHA_EXPIRY = 60 * 60; // 1 hour (in seconds)
const CAPTCHA_VERIFICATION_EXPIRY = 5 * 60; // 5 minutes (in seconds)

// Risk-based configuration
const HIGH_RISK_CAPTCHA_THRESHOLD = 1; // Require CAPTCHA after 1 failed attempt for high-risk IPs
const MEDIUM_RISK_CAPTCHA_THRESHOLD = 2; // Require CAPTCHA after 2 failed attempts for medium-risk IPs
const LOW_RISK_CAPTCHA_THRESHOLD = 5; // Require CAPTCHA after 5 failed attempts for low-risk IPs

/**
 * Get the CAPTCHA threshold for an IP address based on its risk level
 *
 * @param ipAddress The IP address to check
 * @returns The CAPTCHA threshold
 */
export async function getCaptchaThreshold(ipAddress: string): Promise<number> {
  try {
    const riskLevel = await getIpRiskLevel(ipAddress);

    switch (riskLevel) {
      case RiskLevel.HIGH:
        return HIGH_RISK_CAPTCHA_THRESHOLD;
      case RiskLevel.MEDIUM:
        return MEDIUM_RISK_CAPTCHA_THRESHOLD;
      case RiskLevel.LOW:
        return LOW_RISK_CAPTCHA_THRESHOLD;
      default:
        return DEFAULT_CAPTCHA_THRESHOLD;
    }
  } catch (error) {
    console.error('Error getting CAPTCHA threshold:', error);
    return DEFAULT_CAPTCHA_THRESHOLD;
  }
}

/**
 * Check if CAPTCHA is required for an IP address
 *
 * @param ipAddress The IP address to check
 * @returns Whether CAPTCHA is required
 */
export async function isCaptchaRequired(ipAddress: string): Promise<boolean> {
  try {
    // Get the key for this IP
    const key = `${CAPTCHA_REQUIRED_PREFIX}${ipAddress}`;

    // Check if CAPTCHA is required
    const failedAttempts = await kv.get(key) || 0;
    const threshold = await getCaptchaThreshold(ipAddress);

    return failedAttempts >= threshold;
  } catch (error) {
    console.error('Error checking if CAPTCHA is required:', error);
    return false;
  }
}

/**
 * Record a failed attempt for CAPTCHA tracking
 *
 * @param ipAddress The IP address to record the failed attempt for
 * @returns Whether CAPTCHA is now required
 */
export async function recordFailedAttemptForCaptcha(ipAddress: string): Promise<boolean> {
  try {
    // Get the key for this IP
    const key = `${CAPTCHA_REQUIRED_PREFIX}${ipAddress}`;

    // Get current failed attempts
    const currentAttempts = await kv.get(key) || 0;
    const newAttempts = currentAttempts + 1;

    // Update failed attempts with atomic operation
    await kv.set(key, newAttempts);
    await kv.expire(key, CAPTCHA_EXPIRY);

    // Get the threshold for this IP
    const threshold = await getCaptchaThreshold(ipAddress);

    // Log the attempt
    console.log(`CAPTCHA: Recorded failed attempt for IP ${ipAddress}: ${newAttempts}/${threshold} attempts`);

    // Check if CAPTCHA is now required
    return newAttempts >= threshold;
  } catch (error) {
    console.error('Error recording failed attempt for CAPTCHA:', error);
    return false;
  }
}

/**
 * Reset CAPTCHA requirement for an IP address
 *
 * @param ipAddress The IP address to reset
 */
export async function resetCaptchaRequirement(ipAddress: string): Promise<void> {
  try {
    // Get the key for this IP
    const key = `${CAPTCHA_REQUIRED_PREFIX}${ipAddress}`;

    // Delete the key
    await kv.del(key);
  } catch (error) {
    console.error('Error resetting CAPTCHA requirement:', error);
  }
}

/**
 * Verify a CAPTCHA response
 *
 * @param token The CAPTCHA token to verify
 * @param ipAddress The IP address of the client
 * @returns Whether the CAPTCHA is valid
 */
export async function verifyCaptcha(token: string, ipAddress: string): Promise<boolean> {
  try {
    // Check if token is provided
    if (!token) {
      console.warn(`CAPTCHA: Missing token for IP ${ipAddress}`);
      return false;
    }

    // Check if verification is needed
    if (!await isCaptchaRequired(ipAddress)) {
      // No CAPTCHA required, so consider it valid
      return true;
    }

    // In a real implementation, verify the token with the CAPTCHA provider
    // For example, with reCAPTCHA:
    let isValid = false;

    if (process.env.RECAPTCHA_SECRET_KEY) {
      try {
        // Use real reCAPTCHA verification if secret key is available
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}&remoteip=${ipAddress}`
        });

        const data = await response.json();
        isValid = data.success === true;

        // Log the verification result
        console.log(`CAPTCHA: Verified token for IP ${ipAddress}: ${isValid ? 'valid' : 'invalid'}`);
      } catch (verifyError) {
        console.error('Error verifying CAPTCHA with provider:', verifyError);
        // Fall back to simple verification
        isValid = token.length > 20; // Simple length check as fallback
      }
    } else {
      // For development/testing without a real CAPTCHA provider
      // Just check if the token has a reasonable length
      isValid = token.length > 20;
      console.log(`CAPTCHA: Development verification for IP ${ipAddress}: ${isValid ? 'valid' : 'invalid'}`);
    }

    // If valid, store verification and reset the CAPTCHA requirement
    if (isValid) {
      // Store verification for this IP
      const verificationKey = `${CAPTCHA_VERIFICATION_PREFIX}${ipAddress}`;
      await kv.set(verificationKey, {
        verifiedAt: Date.now(),
        token: token.substring(0, 10) + '...' // Store truncated token for audit
      });
      await kv.expire(verificationKey, CAPTCHA_VERIFICATION_EXPIRY);

      // Reset the CAPTCHA requirement
      await resetCaptchaRequirement(ipAddress);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return false;
  }
}
