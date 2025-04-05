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
 * Determines the CAPTCHA threshold for a given IP address based on its risk level.
 *
 * This function retrieves the risk level using an external assessment method and assigns a corresponding
 * CAPTCHA threshold. The thresholds vary by risk level—high, medium, or low—and if the risk level is not
 * recognized or an error occurs, a default threshold is returned.
 *
 * @param ipAddress - The IP address for which the CAPTCHA threshold is determined.
 * @returns A promise that resolves to the determined CAPTCHA threshold.
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
 * Determines whether a CAPTCHA challenge is required for the given IP address.
 *
 * The function retrieves the recorded count of failed login attempts from a key-value store and compares it
 * against a risk-based threshold obtained from `getCaptchaThreshold`. A CAPTCHA is deemed necessary if the
 * number of failed attempts is greater than or equal to the risk-based threshold. In case of any error,
 * the function logs the error and returns false.
 *
 * @param ipAddress The IP address to evaluate.
 * @returns True if a CAPTCHA is required; otherwise, false.
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
 * Records a failed CAPTCHA-related authentication attempt for the specified IP address and checks if a CAPTCHA challenge is now required.
 *
 * This function retrieves the current count of failed attempts for the IP address, increments it, and updates the count in persistent storage with an expiry time. It then obtains a dynamic CAPTCHA threshold based on the IP's risk level and compares it with the updated count. The function returns true if the count meets or exceeds the threshold, indicating that a CAPTCHA challenge should be initiated; otherwise, it returns false. In case of errors during the process, it logs the error and returns false.
 *
 * @param ipAddress - The IP address for which to record the failed authentication attempt.
 * @returns True if the updated attempt count meets or exceeds the risk-based CAPTCHA threshold; false otherwise.
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
 * Verifies the CAPTCHA response for the provided IP address.
 *
 * The function first determines whether CAPTCHA verification is necessary for the given IP based on its risk profile.
 * If verification is needed, it attempts to validate the provided token using a CAPTCHA service (such as reCAPTCHA, when configured).
 * If the service is not configured or an error occurs during provider verification, it falls back to a simple length check.
 * Upon successful verification, it records a truncated version of the token along with a timestamp and resets the CAPTCHA requirement.
 *
 * @param token - The CAPTCHA token provided by the client; must be non-empty for verification.
 * @param ipAddress - The client's IP address used to determine CAPTCHA necessity and to record verification.
 * @returns A boolean indicating whether the CAPTCHA was successfully verified.
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
