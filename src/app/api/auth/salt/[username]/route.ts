import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { withRateLimit } from '@/middleware/withRateLimit';
import { withAuthSecurity } from '@/middleware/withAuthSecurity';
import { AuditService } from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';

/**
 * Get the salt for a user by username
 *
 * This endpoint is used to retrieve the salt for a user, which is needed
 * to generate a zero-knowledge proof for authentication. This endpoint
 * does not require authentication since the salt alone is not sensitive.
 */
/**
 * Get salt for a user by username
 * This endpoint is rate limited to prevent brute force attacks
 */
export const GET = withRateLimit(
  withAuthSecurity(
    async (request: NextRequest, { params }: { params: { username: string } }) => {
    try {
      const username = params.username;

      // Validate username
      if (!username) {
        return NextResponse.json(
          { success: false, error: 'Username is required' },
          { status: 400 }
        );
      }

      // Get user from database
      const userKey = `user:${username}`;
      const user = await kv.get(userKey);

      // Check if user exists
      if (!user) {
        // For security reasons, we don't want to reveal whether a user exists
        // So we return a random salt that won't work
        const randomSalt = Math.random().toString(36).substring(2, 15);

        // Get IP address and user agent for logging
        const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Log the salt retrieval attempt for non-existent user
        await AuditService.logEvent({
          userId: 'unknown', // User doesn't exist
          tenantId: 'global', // Use global tenant for security events
          action: AuditAction.USER_LOGIN, // Using USER_LOGIN for salt retrieval
          severity: AuditSeverity.INFO,
          ipAddress,
          userAgent,
          details: {
            username,
            action: 'salt_retrieval',
            success: false,
            reason: 'User not found'
          },
          success: false
        });

        return NextResponse.json({
          success: true,
          salt: randomSalt
        });
      }

      // Get IP address and user agent for logging
      const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Log the salt retrieval
      await AuditService.logEvent({
        userId: user.id,
        tenantId: 'global', // Use global tenant for security events
        action: AuditAction.USER_LOGIN, // Using USER_LOGIN for salt retrieval
        severity: AuditSeverity.INFO,
        ipAddress,
        userAgent,
        details: {
          username,
          action: 'salt_retrieval',
          success: true
        },
        success: true
      });

      // Return the user's salt
      return NextResponse.json({
        success: true,
        salt: user.salt
      });
    } catch (error) {
      console.error('Error retrieving salt:', error);

      return NextResponse.json(
        { success: false, error: 'Server error' },
        { status: 500 }
      );
    }
  },
  {
    // Rate limit to 20 requests per minute per IP
    limit: 20,
    windowInSeconds: 60,
    // Custom identifier function that combines IP and username
    identifierFn: (req: NextRequest) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      const username = req.nextUrl.pathname.split('/').pop() || '';
      return `salt:${ip}:${username}`;
    },
    // Custom response when rate limit is exceeded
    onRateLimitExceeded: (req: NextRequest, resetInSeconds: number) => {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${resetInSeconds} seconds.`
        },
        {
          status: 429,
          headers: { 'Retry-After': resetInSeconds.toString() }
        }
      );
    }
  }
  )
);
