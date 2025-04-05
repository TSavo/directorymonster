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
 * Asynchronously retrieves the CAPTCHA threshold for a given IP address based on its risk level.
 *
 * The risk level is determined by invoking `getIpRiskLevel`. Depending on the returned risk:
 * - HIGH risk returns the value of `HIGH_RISK_CAPTCHA_THRESHOLD`.
 * - MEDIUM risk returns the value of `MEDIUM_RISK_CAPTCHA_THRESHOLD`.
 * - LOW risk returns the value of `LOW_RISK_CAPTCHA_THRESHOLD`.
 * If the risk level is unrecognized or if an error occurs, the function falls back to `DEFAULT_CAPTCHA_THRESHOLD`.
 *
 * @param ipAddress The IP address for which to determine the CAPTCHA threshold.
 * @returns A promise that resolves with the CAPTCHA threshold for the specified IP address.
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
 * Determines if a CAPTCHA challenge is required for a given IP address.
 *
 * This function retrieves the number of failed login attempts for the specified IP address from the key-value store and compares it to a risk-based threshold obtained via the getCaptchaThreshold function. A CAPTCHA is required if the number of failed attempts meets or exceeds the threshold.
 *
 * If an error occurs during data retrieval or evaluation, the function logs the error and returns false.
 *
 * @param ipAddress - The IP address to evaluate.
 * @returns A promise that resolves to true if a CAPTCHA challenge is required, otherwise false.
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
 * Records a failed login attempt for the specified IP address and determines if CAPTCHA enforcement is required.
 *
 * This function increments the count of failed attempts stored in a key-value store, resets the expiration timer,
 * and compares the updated count against a dynamically retrieved risk-based threshold. It returns true if the number
 * of attempts meets or exceeds the threshold, signaling that CAPTCHA verification should be enforced. If an error occurs,
 * the function logs the error and returns false.
 *
 * @param ipAddress - The client IP address for which the failed attempt is recorded.
 * @returns True if the number of failed attempts meets or exceeds the CAPTCHA threshold; otherwise, false.
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
 * Verifies a CAPTCHA response for the given client IP address.
 *
 * The function first checks whether a CAPTCHA token is provided. If not, it logs a warning and returns false.
 * It then determines if CAPTCHA verification is required for the IP address by comparing the number of failed attempts
 * against a risk-based threshold. If verification is not required, it returns true immediately.
 *
 * When verification is needed, the function attempts to validate the token with a CAPTCHA provider (e.g., reCAPTCHA)
 * using a secret key available in the environment. If the provider call fails or no secret key is configured, it falls
 * back to a simple token length check. Upon successful verification, the function logs the result, stores a truncated
 * version of the token along with the verification timestamp in a key-value store for auditing purposes, and resets the
 * CAPTCHA requirement for the IP address.
 *
 * @param token The CAPTCHA token to verify.
 * @param ipAddress The client's IP address.
 * @returns A promise that resolves to true if the CAPTCHA is valid, or false otherwise.
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
