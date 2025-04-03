/**
 * User Session Management
 * 
 * This module provides functionality for managing user sessions, including:
 * - Tracking active sessions
 * - Listing active sessions for a user
 * - Revoking specific sessions
 * - Revoking all sessions for a user
 * 
 * Sessions are tracked using Redis for distributed environments.
 */

import { getRedisClient } from '@/lib/redis-client';
import { config } from '@/lib/config';
import { logSecurityEvent, SecurityEventType } from './security-logger';
import { revokeToken, isTokenRevoked } from './token-validation';

// Redis key prefixes
const SESSION_PREFIX = `${config.redis.keyPrefix}session:`;
const USER_SESSIONS_PREFIX = `${config.redis.keyPrefix}user:sessions:`;

// Session interface
export interface Session {
  // Session ID (JWT ID)
  id: string;
  // User ID
  userId: string;
  // Device information
  device?: string;
  // IP address
  ip?: string;
  // Last activity timestamp
  lastActivity: number;
  // Expiration timestamp
  expiresAt: number;
  // Whether this is the current session
  isCurrent?: boolean;
}

/**
 * Track a new user session
 * 
 * @param userId - The ID of the user
 * @param jti - The JWT ID of the token
 * @param exp - The expiration time of the token
 * @param device - The device information
 * @param ip - The IP address
 * @returns True if the session was successfully tracked
 */
export async function trackSession(
  userId: string,
  jti: string,
  exp: number,
  device?: string,
  ip?: string
): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Create session object
    const session: Session = {
      id: jti,
      userId,
      device,
      ip,
      lastActivity: currentTime,
      expiresAt: exp
    };
    
    // Calculate TTL (time to live) for the session record
    const ttl = Math.max(0, exp - currentTime);
    
    // Store session data
    await redisClient.setex(
      `${SESSION_PREFIX}${jti}`,
      ttl,
      JSON.stringify(session)
    );
    
    // Add session to user's session list
    await redisClient.sadd(`${USER_SESSIONS_PREFIX}${userId}`, jti);
    
    // Set expiration on the user's session list
    // We use a longer expiration to keep track of sessions even after they expire
    // This helps with session history and analytics
    await redisClient.expire(
      `${USER_SESSIONS_PREFIX}${userId}`,
      ttl + 86400 // 24 hours after the session expires
    );
    
    // Log session creation
    await logSecurityEvent({
      type: SecurityEventType.SESSION_CREATED,
      userId,
      ip,
      userAgent: device,
      details: { jti, expiresAt: exp }
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking session:', error);
    return false;
  }
}

/**
 * Update a user session's last activity timestamp
 * 
 * @param jti - The JWT ID of the token
 * @returns True if the session was successfully updated
 */
export async function updateSessionActivity(jti: string): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const sessionKey = `${SESSION_PREFIX}${jti}`;
    
    // Get the session data
    const sessionData = await redisClient.get(sessionKey);
    if (!sessionData) {
      return false;
    }
    
    // Parse the session data
    const session = JSON.parse(sessionData) as Session;
    
    // Update last activity timestamp
    session.lastActivity = Math.floor(Date.now() / 1000);
    
    // Calculate TTL (time to live) for the session record
    const ttl = Math.max(0, session.expiresAt - session.lastActivity);
    
    // Store updated session data
    await redisClient.setex(
      sessionKey,
      ttl,
      JSON.stringify(session)
    );
    
    return true;
  } catch (error) {
    console.error('Error updating session activity:', error);
    return false;
  }
}

/**
 * Get all active sessions for a user
 * 
 * @param userId - The ID of the user
 * @param currentSessionId - The JWT ID of the current session
 * @returns Array of active sessions
 */
export async function getUserSessions(
  userId: string,
  currentSessionId?: string
): Promise<Session[]> {
  try {
    const redisClient = getRedisClient();
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
    
    // Get all session IDs for the user
    const sessionIds = await redisClient.smembers(userSessionsKey);
    
    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }
    
    // Get session data for each session ID
    const sessions: Session[] = [];
    
    for (const jti of sessionIds) {
      // Check if the token has been revoked
      const isRevoked = await isTokenRevoked(jti);
      
      if (isRevoked) {
        // Remove revoked session from the user's session list
        await redisClient.srem(userSessionsKey, jti);
        continue;
      }
      
      // Get session data
      const sessionData = await redisClient.get(`${SESSION_PREFIX}${jti}`);
      
      if (sessionData) {
        const session = JSON.parse(sessionData) as Session;
        
        // Check if this is the current session
        if (currentSessionId && jti === currentSessionId) {
          session.isCurrent = true;
        }
        
        sessions.push(session);
      } else {
        // Session data not found, remove from user's session list
        await redisClient.srem(userSessionsKey, jti);
      }
    }
    
    // Sort sessions by last activity (most recent first)
    return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
}

/**
 * Revoke a specific session
 * 
 * @param userId - The ID of the user
 * @param jti - The JWT ID of the session to revoke
 * @returns True if the session was successfully revoked
 */
export async function revokeSession(
  userId: string,
  jti: string
): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    
    // Get session data
    const sessionData = await redisClient.get(`${SESSION_PREFIX}${jti}`);
    
    if (!sessionData) {
      return false;
    }
    
    // Parse session data
    const session = JSON.parse(sessionData) as Session;
    
    // Verify that the session belongs to the user
    if (session.userId !== userId) {
      // Log unauthorized revocation attempt
      await logSecurityEvent({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId,
        details: {
          action: 'Attempted to revoke session belonging to another user',
          sessionId: jti,
          sessionUserId: session.userId
        }
      });
      
      return false;
    }
    
    // Revoke the token
    const success = await revokeToken(jti, session.expiresAt);
    
    if (success) {
      // Remove session from user's session list
      await redisClient.srem(`${USER_SESSIONS_PREFIX}${userId}`, jti);
      
      // Delete session data
      await redisClient.del(`${SESSION_PREFIX}${jti}`);
      
      // Log session revocation
      await logSecurityEvent({
        type: SecurityEventType.SESSION_REVOKED,
        userId,
        ip: session.ip,
        userAgent: session.device,
        details: { jti }
      });
    }
    
    return success;
  } catch (error) {
    console.error('Error revoking session:', error);
    return false;
  }
}

/**
 * Revoke all sessions for a user
 * 
 * @param userId - The ID of the user
 * @param excludeCurrentSession - Whether to exclude the current session
 * @param currentSessionId - The JWT ID of the current session
 * @returns The number of sessions revoked
 */
export async function revokeAllUserSessions(
  userId: string,
  excludeCurrentSession: boolean = false,
  currentSessionId?: string
): Promise<number> {
  try {
    const redisClient = getRedisClient();
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
    
    // Get all session IDs for the user
    const sessionIds = await redisClient.smembers(userSessionsKey);
    
    if (!sessionIds || sessionIds.length === 0) {
      return 0;
    }
    
    let revokedCount = 0;
    
    for (const jti of sessionIds) {
      // Skip current session if requested
      if (excludeCurrentSession && currentSessionId && jti === currentSessionId) {
        continue;
      }
      
      // Get session data
      const sessionData = await redisClient.get(`${SESSION_PREFIX}${jti}`);
      
      if (sessionData) {
        // Parse session data
        const session = JSON.parse(sessionData) as Session;
        
        // Revoke the token
        const success = await revokeToken(jti, session.expiresAt);
        
        if (success) {
          // Delete session data
          await redisClient.del(`${SESSION_PREFIX}${jti}`);
          revokedCount++;
        }
      }
      
      // Remove from user's session list
      await redisClient.srem(userSessionsKey, jti);
    }
    
    // Log session revocation
    await logSecurityEvent({
      type: SecurityEventType.SESSIONS_REVOKED,
      userId,
      details: {
        count: revokedCount,
        excludedCurrentSession: excludeCurrentSession
      }
    });
    
    return revokedCount;
  } catch (error) {
    console.error('Error revoking all user sessions:', error);
    return 0;
  }
}
