/**
 * Authentication security middleware
 *
 * This middleware combines IP blocking, CAPTCHA, and progressive delays
 * to enhance the security of authentication endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isIpBlocked, getBlockInfo } from '@/lib/auth/ip-blocker';
import { isCaptchaRequired, verifyCaptcha } from '@/lib/auth/captcha-service';
import { applyProgressiveDelay } from '@/lib/auth/progressive-delay';
import { AuditService } from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';

/**
 * Authentication security options
 */
export interface AuthSecurityOptions {
  /**
   * Whether to check for IP blocking
   * @default true
   */
  checkIpBlocking?: boolean;

  /**
   * Whether to check for CAPTCHA requirement
   * @default true
   */
  checkCaptcha?: boolean;

  /**
   * Whether to apply progressive delays
   * @default true
   */
  applyDelay?: boolean;

  /**
   * Custom response function when IP is blocked
   */
  onIpBlocked?: (req: NextRequest, blockInfo: any) => NextResponse;

  /**
   * Custom response function when CAPTCHA is required but missing
   */
  onCaptchaRequired?: (req: NextRequest) => NextResponse;
}

/**
 * Higher-order function that creates a security-enhanced handler for authentication endpoints
 *
 * @param handler The API route handler to wrap with security enhancements
 * @param options Security options
 * @returns A new handler with security enhancements applied
 */
export function withAuthSecurity<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: AuthSecurityOptions = {}
): T {
  // Default options
  const {
    checkIpBlocking = true,
    checkCaptcha = true,
    applyDelay = true,
    onIpBlocked = (req: NextRequest, blockInfo: any) =>
      NextResponse.json(
        {
          success: false,
          error: 'Too many failed attempts',
          message: `Your IP address has been temporarily blocked due to too many failed attempts. Please try again in ${blockInfo.remainingMinutes} minutes.`,
          blocked: true,
          remainingMinutes: blockInfo.remainingMinutes
        },
        { status: 403 }
      ),
    onCaptchaRequired = (req: NextRequest) =>
      NextResponse.json(
        {
          success: false,
          error: 'CAPTCHA required',
          message: 'Please complete the CAPTCHA challenge to continue.',
          captchaRequired: true
        },
        { status: 400 }
      )
  } = options;

  // Create the security-enhanced handler
  const secureHandler = async (...args: Parameters<T>): Promise<NextResponse> => {
    const req = args[0] as NextRequest;

    // Get IP address
    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // 1. Check if IP is blocked
      if (checkIpBlocking) {
        const blocked = await isIpBlocked(ipAddress);
        if (blocked) {
          const blockInfo = await getBlockInfo(ipAddress);

          // Log the blocked attempt to the audit system
          await AuditService.logEvent({
            userId: 'unknown', // We don't know the user ID yet
            tenantId: 'global', // Use global tenant for security events
            action: AuditAction.USER_LOGIN,
            severity: AuditSeverity.ERROR,
            ipAddress,
            userAgent,
            details: {
              reason: 'IP address is blocked',
              blockInfo
            },
            success: false
          });

          return onIpBlocked(req, blockInfo);
        }
      }

      // 2. Check if CAPTCHA is required
      if (checkCaptcha) {
        const captchaRequired = await isCaptchaRequired(ipAddress);
        if (captchaRequired) {
          // Get the CAPTCHA token from the request
          let captchaToken: string | null = null;

          // Try to get token from body
          try {
            const body = await req.clone().json();
            captchaToken = body.captchaToken || null;
          } catch (e) {
            // If we can't parse the body, check query params
            const url = new URL(req.url);
            captchaToken = url.searchParams.get('captchaToken');
          }

          // If no token or invalid token, require CAPTCHA
          if (!captchaToken || !(await verifyCaptcha(captchaToken, ipAddress))) {
            // Log the CAPTCHA requirement to the audit system
            await AuditService.logEvent({
              userId: 'unknown', // We don't know the user ID yet
              tenantId: 'global', // Use global tenant for security events
              action: AuditAction.USER_LOGIN,
              severity: AuditSeverity.WARNING,
              ipAddress,
              userAgent,
              details: {
                reason: 'CAPTCHA required but missing or invalid'
              },
              success: false
            });

            return onCaptchaRequired(req);
          }
        }
      }

      // 3. Apply progressive delay
      if (applyDelay) {
        await applyProgressiveDelay(ipAddress);
      }

      // 4. Call the original handler
      return handler(...args);
    } catch (error) {
      console.error('Error in auth security middleware:', error);

      // If there's an error in the security checks, allow the request to proceed
      // This is a fail-open approach, which is better than blocking legitimate users
      return handler(...args);
    }
  };

  // Return the security-enhanced handler with the same type as the original handler
  return secureHandler as T;
}
