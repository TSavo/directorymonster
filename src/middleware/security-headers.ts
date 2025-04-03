/**
 * Security Headers Middleware
 * 
 * This middleware adds security headers to all responses to protect against
 * common web vulnerabilities such as XSS, CSRF, clickjacking, and MIME type sniffing.
 * 
 * It follows security best practices and recommendations from OWASP.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware function
 * 
 * @param request - The incoming request
 * @returns The response with security headers added
 */
export function middleware(request: NextRequest) {
  // Process the request with the Next.js default handler
  const response = NextResponse.next();
  
  // Add security headers
  const headers = response.headers;
  
  // Content Security Policy (CSP)
  // Restricts the sources from which resources can be loaded
  // This is a basic policy - customize based on your application's needs
  headers.set(
    'Content-Security-Policy',
    [
      // Default fallback for everything else
      "default-src 'self'",
      // Scripts can only be loaded from the same origin and inline scripts are allowed
      "script-src 'self' 'unsafe-inline'",
      // Styles can only be loaded from the same origin and inline styles are allowed
      "style-src 'self' 'unsafe-inline'",
      // Images can be loaded from the same origin and data: URLs
      "img-src 'self' data:",
      // Fonts can only be loaded from the same origin
      "font-src 'self'",
      // Connect to the same origin only
      "connect-src 'self'",
      // Media can only be loaded from the same origin
      "media-src 'self'",
      // Object embeds are not allowed
      "object-src 'none'",
      // Form actions can only target the same origin
      "form-action 'self'",
      // Base tags are not allowed
      "base-uri 'none'",
      // Frame ancestors (parent frames) must be the same origin
      "frame-ancestors 'self'",
      // Block mixed content
      "block-all-mixed-content",
      // Enable CSP reporting (if you have a reporting endpoint)
      // "report-uri https://example.com/csp-report"
    ].join('; ')
  );
  
  // X-Content-Type-Options
  // Prevents browsers from MIME-sniffing a response away from the declared content type
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  // Prevents the page from being framed by other sites (clickjacking protection)
  headers.set('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  // Enables the browser's built-in XSS filtering
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  // Controls how much referrer information is included with requests
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Strict-Transport-Security (HSTS)
  // Forces browsers to use HTTPS for the specified domain
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Permissions-Policy (formerly Feature-Policy)
  // Restricts which browser features can be used
  headers.set(
    'Permissions-Policy',
    [
      'accelerometer=self',
      'camera=self',
      'geolocation=self',
      'gyroscope=self',
      'magnetometer=self',
      'microphone=self',
      'payment=self',
      'usb=self'
    ].join(', ')
  );
  
  // Cache-Control
  // Prevents caching of sensitive information
  // Only apply to non-static resources
  if (!request.nextUrl.pathname.startsWith('/_next/') && 
      !request.nextUrl.pathname.includes('/static/')) {
    headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  }
  
  return response;
}

/**
 * Middleware matcher configuration
 * Applies the middleware to all routes except static files and API routes that need different headers
 */
export const config = {
  matcher: [
    // Apply to all routes except static files, images, and favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
