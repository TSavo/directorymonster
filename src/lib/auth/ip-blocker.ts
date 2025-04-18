/**
 * IP-based blocking for authentication security
 *
 * This module provides functions to track failed login attempts and
 * block IP addresses that exceed a threshold of failures.
 * Supports configurable thresholds based on IP reputation and risk factors.
 */

import { kv } from '@/lib/redis-client';
import { AuditService } from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';

// Key prefixes
const FAILED_ATTEMPTS_PREFIX = 'auth:failed:';
const BLOCKED_IP_PREFIX = 'auth:blocked:';
const IP_REPUTATION_PREFIX = 'auth:reputation:';
const IP_RISK_PREFIX = 'auth:risk:';

// Configuration with defaults
const DEFAULT_MAX_FAILED_ATTEMPTS = 10; // Block after 10 failed attempts
const FAILED_ATTEMPT_EXPIRY = 60 * 60; // 1 hour (in seconds)
const DEFAULT_BLOCK_DURATION = 24 * 60 * 60; // 24 hours (in seconds)

// Risk-based configuration
const HIGH_RISK_MAX_ATTEMPTS = 5; // Block high-risk IPs after 5 failed attempts
const MEDIUM_RISK_MAX_ATTEMPTS = 8; // Block medium-risk IPs after 8 failed attempts
const LOW_RISK_MAX_ATTEMPTS = 15; // Block low-risk IPs after 15 failed attempts

// Block duration based on risk
const HIGH_RISK_BLOCK_DURATION = 48 * 60 * 60; // 48 hours for high-risk IPs
const MEDIUM_RISK_BLOCK_DURATION = 24 * 60 * 60; // 24 hours for medium-risk IPs
const LOW_RISK_BLOCK_DURATION = 12 * 60 * 60; // 12 hours for low-risk IPs

// Risk levels
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Get the risk level for an IP address
 *
 * @param ipAddress The IP address to check
 * @returns The risk level for the IP
 */
export async function getIpRiskLevel(ipAddress: string): Promise<RiskLevel> {
  try {
    // Get the key for this IP's risk level
    const key = `${IP_RISK_PREFIX}${ipAddress}`;

    // Get the current risk level
    const riskLevel = await kv.get(key) as RiskLevel | null;

    // Return the risk level or default to medium
    return riskLevel || RiskLevel.MEDIUM;
  } catch (error) {
    console.error('Error getting IP risk level:', error);
    return RiskLevel.MEDIUM; // Default to medium risk
  }
}

/**
 * Set the risk level for an IP address
 *
 * @param ipAddress The IP address to set the risk level for
 * @param riskLevel The risk level to set
 */
export async function setIpRiskLevel(ipAddress: string, riskLevel: RiskLevel): Promise<void> {
  try {
    // Get the key for this IP's risk level
    const key = `${IP_RISK_PREFIX}${ipAddress}`;

    // Set the risk level
    await kv.set(key, riskLevel);
    await kv.expire(key, 30 * 24 * 60 * 60); // 30 days expiry

    // Log the risk level change
    try {
      await AuditService.logEvent({
        action: AuditAction.IP_RISK_LEVEL_CHANGED,
        severity: AuditSeverity.INFO,
        ipAddress,
        details: {
          riskLevel,
          timestamp: new Date().toISOString()
        }
      });
    } catch (auditError) {
      console.error('Error logging to audit service:', auditError);
    }
  } catch (error) {
    console.error('Error setting IP risk level:', error);
  }
}

/**
 * Get the maximum failed attempts allowed for an IP based on its risk level
 *
 * @param ipAddress The IP address to check
 * @returns The maximum failed attempts allowed
 */
export async function getMaxFailedAttempts(ipAddress: string): Promise<number> {
  try {
    const riskLevel = await getIpRiskLevel(ipAddress);

    switch (riskLevel) {
      case RiskLevel.HIGH:
        return HIGH_RISK_MAX_ATTEMPTS;
      case RiskLevel.MEDIUM:
        return MEDIUM_RISK_MAX_ATTEMPTS;
      case RiskLevel.LOW:
        return LOW_RISK_MAX_ATTEMPTS;
      default:
        return DEFAULT_MAX_FAILED_ATTEMPTS;
    }
  } catch (error) {
    console.error('Error getting max failed attempts:', error);
    return DEFAULT_MAX_FAILED_ATTEMPTS;
  }
}

/**
 * Get the block duration for an IP based on its risk level
 *
 * @param ipAddress The IP address to check
 * @returns The block duration in seconds
 */
export async function getBlockDuration(ipAddress: string): Promise<number> {
  try {
    const riskLevel = await getIpRiskLevel(ipAddress);

    switch (riskLevel) {
      case RiskLevel.HIGH:
        return HIGH_RISK_BLOCK_DURATION;
      case RiskLevel.MEDIUM:
        return MEDIUM_RISK_BLOCK_DURATION;
      case RiskLevel.LOW:
        return LOW_RISK_BLOCK_DURATION;
      default:
        return DEFAULT_BLOCK_DURATION;
    }
  } catch (error) {
    console.error('Error getting block duration:', error);
    return DEFAULT_BLOCK_DURATION;
  }
}

/**
 * Record a failed login attempt for an IP address
 *
 * @param ipAddress The IP address to record the failed attempt for
 * @param username The username that was attempted
 * @param userAgent The user agent of the client
 * @returns Whether the IP is now blocked
 */
export async function recordFailedAttempt(
  ipAddress: string,
  username: string,
  userAgent: string
): Promise<boolean> {
  try {
    // Check if IP is already blocked
    const isBlocked = await isIpBlocked(ipAddress);
    if (isBlocked) {
      // Log to the audit system if a user ID is available
      try {
        // Try to find the user ID from the username
        const users = await kv.keys('user:*');
        let userId = 'unknown';

        for (const userKey of users) {
          const user = await kv.get(userKey);
          if (user && (user.username === username || user.email === username)) {
            userId = user.id;
            break;
          }
        }

        // Log the blocked attempt
        await AuditService.logEvent({
          userId,
          tenantId: 'global', // Use global tenant for security events
          action: AuditAction.USER_LOGIN,
          severity: AuditSeverity.ERROR,
          ipAddress,
          userAgent,
          details: {
            username,
            reason: 'IP address is blocked',
            blockedIp: true
          },
          success: false
        });
      } catch (error) {
        console.error('Error logging to audit service:', error);
      }

      return true;
    }

    // Get the key for this IP
    const key = `${FAILED_ATTEMPTS_PREFIX}${ipAddress}`;

    // Get current failed attempts
    const currentAttempts = await kv.get(key) || 0;
    const newAttempts = currentAttempts + 1;

    // Update failed attempts with atomic operation
    await kv.set(key, newAttempts);
    await kv.expire(key, FAILED_ATTEMPT_EXPIRY);

    // Get the maximum allowed attempts for this IP based on risk level
    const maxAttempts = await getMaxFailedAttempts(ipAddress);
    const riskLevel = await getIpRiskLevel(ipAddress);

    // Log to the audit system
    try {
      // Try to find the user ID from the username
      const users = await kv.keys('user:*');
      let userId = 'unknown';

      for (const userKey of users) {
        const user = await kv.get(userKey);
        if (user && (user.username === username || user.email === username)) {
          userId = user.id;
          break;
        }
      }

      // Log the failed attempt
      await AuditService.logEvent({
        userId,
        tenantId: 'global', // Use global tenant for security events
        action: AuditAction.USER_LOGIN,
        severity: AuditSeverity.WARNING,
        ipAddress,
        userAgent,
        details: {
          username,
          reason: 'Invalid credentials',
          attemptCount: newAttempts,
          maxAttempts: maxAttempts,
          riskLevel: riskLevel,
          remainingAttempts: Math.max(0, maxAttempts - newAttempts)
        },
        success: false
      });
    } catch (error) {
      console.error('Error logging to audit service:', error);
    }

    // Check if we should block the IP based on risk-adjusted threshold
    if (newAttempts >= maxAttempts) {
      await blockIp(ipAddress, username, userAgent);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return false;
  }
}

/**
 * Block an IP address
 *
 * @param ipAddress The IP address to block
 * @param username The username associated with the blocking event
 * @param userAgent The user agent of the client
 */
export async function blockIp(
  ipAddress: string,
  username: string,
  userAgent: string
): Promise<void> {
  try {
    // Get the key for this IP
    const key = `${BLOCKED_IP_PREFIX}${ipAddress}`;

    // Get the risk level and block duration for this IP
    const riskLevel = await getIpRiskLevel(ipAddress);
    const blockDuration = await getBlockDuration(ipAddress);

    // Block the IP
    await kv.set(key, {
      blockedAt: Date.now(),
      reason: 'Too many failed login attempts',
      username,
      userAgent,
      riskLevel,
      blockDuration
    });

    // Set expiration based on risk level
    await kv.expire(key, blockDuration);

    // Log to the audit system
    try {
      // Try to find the user ID from the username
      const users = await kv.keys('user:*');
      let userId = 'unknown';

      for (const userKey of users) {
        const user = await kv.get(userKey);
        if (user && (user.username === username || user.email === username)) {
          userId = user.id;
          break;
        }
      }

      // Log the blocking event
      await AuditService.logEvent({
        userId,
        tenantId: 'global', // Use global tenant for security events
        action: AuditAction.USER_LOGIN,
        severity: AuditSeverity.ERROR,
        ipAddress,
        userAgent,
        details: {
          username,
          reason: 'IP address blocked due to too many failed attempts',
          riskLevel: await getIpRiskLevel(ipAddress),
          blockDuration: blockDuration,
          blockDurationHours: blockDuration / 3600,
          blockedUntil: new Date(Date.now() + blockDuration * 1000).toISOString()
        },
        success: false
      });
    } catch (error) {
      console.error('Error logging to audit service:', error);
    }

    console.warn(`Blocked IP address ${ipAddress} for ${blockDuration / 3600} hours due to too many failed login attempts (risk level: ${riskLevel})`);
  } catch (error) {
    console.error('Error blocking IP:', error);
  }
}

/**
 * Check if an IP address is blocked
 *
 * @param ipAddress The IP address to check
 * @returns Whether the IP is blocked
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  try {
    // Get the key for this IP
    const key = `${BLOCKED_IP_PREFIX}${ipAddress}`;

    // Check if the IP is blocked
    const blockInfo = await kv.get(key);

    return !!blockInfo;
  } catch (error) {
    console.error('Error checking if IP is blocked:', error);
    return false;
  }
}

/**
 * Get information about a blocked IP
 *
 * @param ipAddress The IP address to get information for
 * @returns Information about the blocked IP, or null if not blocked
 */
export async function getBlockInfo(ipAddress: string): Promise<any> {
  try {
    // Get the key for this IP
    const key = `${BLOCKED_IP_PREFIX}${ipAddress}`;

    // Get block information
    const blockInfo = await kv.get(key);

    if (!blockInfo) {
      return null;
    }

    // Calculate remaining time
    const now = Date.now();
    const blockedAt = blockInfo.blockedAt;
    const blockDuration = BLOCK_DURATION * 1000; // Convert to milliseconds
    const remainingMs = Math.max(0, blockedAt + blockDuration - now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    return {
      ...blockInfo,
      remainingSeconds,
      remainingMinutes,
      remainingHours: Math.ceil(remainingMinutes / 60)
    };
  } catch (error) {
    console.error('Error getting block info:', error);
    return null;
  }
}

/**
 * Reset failed attempts for an IP address
 *
 * @param ipAddress The IP address to reset
 */
export async function resetFailedAttempts(ipAddress: string): Promise<void> {
  try {
    // Get the key for this IP
    const key = `${FAILED_ATTEMPTS_PREFIX}${ipAddress}`;

    // Delete the key
    await kv.del(key);
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
}

/**
 * Unblock an IP address
 *
 * @param ipAddress The IP address to unblock
 * @param adminUsername The username of the admin performing the unblock
 */
export async function unblockIp(
  ipAddress: string,
  adminUsername: string
): Promise<void> {
  try {
    // Get the key for this IP
    const key = `${BLOCKED_IP_PREFIX}${ipAddress}`;

    // Get block information before deleting
    const blockInfo = await kv.get(key);

    if (!blockInfo) {
      return;
    }

    // Delete the key
    await kv.del(key);

    // Reset failed attempts
    await resetFailedAttempts(ipAddress);

    // Log the unblocking event to the audit system
    try {
      // Try to find the admin user ID
      const users = await kv.keys('user:*');
      let adminUserId = 'unknown';

      for (const userKey of users) {
        const user = await kv.get(userKey);
        if (user?.username === adminUsername) {
          adminUserId = user.id;
          break;
        }
      }

      // Log the unblocking event
      await AuditService.logEvent({
        userId: adminUserId,
        tenantId: 'global', // Use global tenant for security events
        action: AuditAction.USER_UPDATED, // Using USER_UPDATED for unblocking action
        severity: AuditSeverity.INFO,
        ipAddress: 'admin-action',
        userAgent: 'admin-action',
        details: {
          action: 'unblock_ip',
          unblocked: ipAddress,
          originalReason: blockInfo.reason,
          blockedAt: new Date(blockInfo.blockedAt).toISOString(),
          originalUsername: blockInfo.username
        },
        success: true
      });
    } catch (error) {
      console.error('Error logging to audit service:', error);
    }

    console.info(`Unblocked IP address ${ipAddress} by admin ${adminUsername}`);
  } catch (error) {
    console.error('Error unblocking IP:', error);
  }
}
