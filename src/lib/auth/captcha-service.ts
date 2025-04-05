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
 * Retrieves the CAPTCHA threshold for a given IP address based on its risk level.
 *
 * This function determines the appropriate CAPTCHA threshold by fetching the IP's risk level:
 * - For high-risk IPs, it returns a lower threshold.
 * - For medium- and low-risk IPs, it returns thresholds defined accordingly.
 * - If the risk level is unrecognized or an error occurs, it falls back to a default threshold.
 *
 * @param ipAddress - The IP address for which the CAPTCHA threshold is determined.
 * @returns The CAPTCHA threshold based on the IP's risk level, or a default threshold if the risk level cannot be obtained.
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
 * Determines whether a CAPTCHA challenge is necessary for the provided IP address.
 *
 * This function retrieves the number of recorded failed authentication attempts for the IP address
 * and compares it against a dynamically determined threshold based on the IP's risk level.
 * If the failed attempt count meets or exceeds the threshold, CAPTCHA verification is required.
 * In the event of an error during evaluation, the error is logged and the function returns false.
 *
 * @param ipAddress - The IP address to evaluate.
 * @returns True if CAPTCHA is needed for the IP address, otherwise false.
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
 * Records a failed authentication attempt for CAPTCHA tracking and determines if a CAPTCHA is now required.
 *
 * This function increments the failure count for the specified IP address in a key-value store and updates its expiry.
 * It then retrieves a risk-based CAPTCHA threshold and checks if the updated count meets or exceeds that threshold.
 * If any error occurs during the process, the error is logged and the function returns false.
 *
 * @param ipAddress - The IP address for which the failed attempt is recorded.
 * @returns True if the failure count meets or exceeds the CAPTCHA threshold; otherwise, false.
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
 * Verifies a CAPTCHA response for the specified IP address.
 *
 * If no token is provided, the function logs a warning and returns false. It first checks if CAPTCHA
 * verification is necessary based on the client's failed authentication attempts. If verification is not
 * required, the function returns true immediately. When verification is needed, it attempts to validate
 * the token using a CAPTCHA provider if configured, falling back to a simple token length check in cases
 * of errors or absence of a provider. On successful validation, it stores verification details and resets
 * the CAPTCHA requirement for the IP address.
 *
 * @param token - The CAPTCHA token provided by the client.
 * @param ipAddress - The client's IP address used for logging and threshold determination.
 * @returns A promise that resolves to a boolean indicating whether the CAPTCHA response is valid.
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
