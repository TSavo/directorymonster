# HTTP Headers Implementation

## Overview

This document describes the improvements made to properly implement HTTP headers for rate limiting in the application.

## Previous Implementation

The previous implementation incorrectly set rate limit headers on the request object instead of the response object, which meant the headers were not being sent to the client.

```typescript
// src/lib/rate-limit.ts
export async function rateLimit(
  req: NextRequest,
  identifier: string,
  limit: number = DEFAULT_RATE_LIMIT
): Promise<NextResponse | null> {
  // ...
  
  // Add rate limit headers to the response
  req.headers.set('X-RateLimit-Limit', limit.toString());
  req.headers.set('X-RateLimit-Remaining', (limit - (currentCount + 1)).toString());
  
  // Rate limit not exceeded
  return null;
}
```

## Improved Implementation

The improved implementation returns headers to be added to the response, ensuring they are properly sent to the client.

```typescript
// src/lib/rate-limit.ts
export async function rateLimit(
  req: NextRequest,
  identifier: string,
  limit: number = DEFAULT_RATE_LIMIT
): Promise<NextResponse | { headers: Headers }> {
  // ...
  
  // Create headers with rate limit information
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', (limit - (currentCount + 1)).toString());
  headers.set('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW).toString());
  
  // Return headers to be added to the response
  return { headers };
}
```

For rate-limited responses, the headers are included in the 429 response:

```typescript
if (currentCount >= limit) {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', '0');
  headers.set('Retry-After', RATE_LIMIT_WINDOW.toString());
  
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.'
    },
    { 
      status: 429,
      headers
    }
  );
}
```

## Security Benefits

1. **Client Awareness**: Clients can now see rate limit information and adjust their behavior accordingly.
2. **Transparency**: Provides clear information about rate limits and when they reset.
3. **Standards Compliance**: Follows HTTP standards for rate limiting headers.
4. **Improved Error Handling**: Adds Retry-After header to help clients handle rate limiting correctly.

## Testing

The implementation is tested in:

- `tests/lib/rate-limit.test.ts`

Run the tests with:

```bash
npx jest tests/lib/rate-limit.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks

## Best Practices

1. Always set headers on the response object, not the request object.
2. Include standard rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
3. Add Retry-After header for 429 responses to help clients handle rate limiting.
4. Use consistent time formats (Unix timestamp) for reset times.
