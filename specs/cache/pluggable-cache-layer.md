# Specification: Pluggable Cache Layer for API Middleware

## Overview

This specification details the extension of the `withCache` API middleware to support a pluggable cache layer with per-service cache policies.

## Background

The current `withCache` middleware sets cache control headers but doesn't actually cache responses. This enhancement will add support for multiple caching backends and configurable caching strategies at the service level.

## Goals

1. Provide a pluggable cache layer that works with multiple backends (Redis, memory, etc.)
2. Support per-service cache policies with customizable TTL, keys, and invalidation strategies
3. Ensure cache consistency across distributed environments
4. Improve API performance through intelligent caching
5. Maintain backward compatibility with existing API routes

## Non-Goals

1. Client-side caching strategies
2. Database query result caching (separate concern)
3. Static asset caching

## Detailed Design

### 1. Cache Provider Interface

```typescript
interface CacheProvider {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  invalidateByTag(tag: string): Promise<void>;
  clearAll(): Promise<void>;
}

interface CacheOptions {
  ttl?: number; // Time-to-live in seconds
  tags?: string[]; // Tags for grouped invalidation 
}
```

### 2. Cache Policy Definition

```typescript
interface CachePolicy {
  enabled: boolean;
  ttl: number;
  generateKey?: (req: NextRequest) => string;
  bypassConditions?: (req: NextRequest) => boolean;
  varyByHeaders?: string[];
  varyByQuery?: string[];
  tags?: string[] | ((req: NextRequest) => string[]);
}

// Standard policies
const cachePolicies = {
  shortLived: {
    enabled: true,
    ttl: 60, // 1 minute
  },
  mediumLived: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  longLived: {
    enabled: true,
    ttl: 3600, // 1 hour
  },
  never: {
    enabled: false,
    ttl: 0,
  }
};
```

### 3. Cache Provider Implementations

1. **Redis Cache Provider**
   - Extends the existing `redisCache` implementation
   - Adds support for tags and advanced operations

2. **Memory Cache Provider**
   - Uses a Map for in-memory caching
   - Suitable for development/testing
   - Time-based expiration using setTimeout

3. **No-op Cache Provider**
   - For disabling caching
   - Always misses and does nothing on write

### 4. Extended `withCache` Middleware

```typescript
export function withCache(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    provider?: CacheProvider | string;
    policy?: CachePolicy | string;
    keyGenerator?: (req: NextRequest) => string;
    debug?: boolean;
  }
) {
  // Implementation details
}
```

The middleware will:
1. Determine the appropriate cache provider
2. Resolve the cache policy
3. Generate a cache key based on request properties
4. Check for cache hits
5. Set response cache headers
6. Store successful responses in cache

### 5. Default Key Generation

```typescript
function defaultKeyGenerator(req: NextRequest): string {
  const url = new URL(req.url);
  const tenantId = req.headers.get('x-tenant-id') || 'public';
  const userId = req.headers.get('x-user-id') || 'anonymous';
  
  // Basic key includes tenant, path, and query
  let key = `cache:${tenantId}:${url.pathname}`;
  
  // Add query parameters
  const queryString = url.searchParams.toString();
  if (queryString) {
    key += `:${queryString}`;
  }
  
  // Add user context for personalized responses
  if (req.headers.get('x-personalized') === 'true') {
    key += `:user:${userId}`;
  }
  
  return key;
}
```

### 6. Cache Registry

```typescript
export class CacheRegistry {
  private providers: Map<string, CacheProvider> = new Map();
  private policies: Map<string, CachePolicy> = new Map();
  
  registerProvider(name: string, provider: CacheProvider): void;
  registerPolicy(name: string, policy: CachePolicy): void;
  getProvider(name: string): CacheProvider;
  getPolicy(name: string): CachePolicy;
}
```

### 7. Integration with Services

Example service configuration:

```typescript
// In listingService.ts
export const listingCachePolicy: CachePolicy = {
  enabled: true,
  ttl: 300, // 5 minutes
  varyByQuery: ['page', 'limit', 'category', 'search'],
  tags: (req) => {
    const tenantId = req.headers.get('x-tenant-id');
    return [`tenant:${tenantId}`, 'listings'];
  }
};

// In API route
export async function GET(req: NextRequest) {
  return withCache(
    req, 
    async (validatedReq) => {
      // API handler logic
      return NextResponse.json(data);
    },
    { policy: listingCachePolicy }
  );
}
```

### 8. Cache Invalidation Strategy

```typescript
// In API route that modifies data
export async function POST(req: NextRequest) {
  // Process the request
  const result = await createListing(data);
  
  // Invalidate cache
  const tenantId = req.headers.get('x-tenant-id');
  await cacheRegistry.getProvider('redis').invalidateByTag(`tenant:${tenantId}`);
  
  return NextResponse.json(result);
}
```

### 9. Cache Headers and Debug Information

The middleware will:
1. Add `X-Cache: HIT` or `X-Cache: MISS` headers
2. Add `X-Cache-Key` header in debug mode
3. Add `X-Cache-TTL` header with remaining TTL

## Security Considerations

1. **Cache Poisoning**: Ensure proper cache key generation to prevent cache poisoning attacks
2. **Sensitive Information**: Don't cache sensitive information (authorization, PII)
3. **DDoS Protection**: Rate limiting cache misses to prevent DDoS via cache-busting

## Performance Considerations

1. **Cache Hit Ratio**: Monitor and optimize cache hit ratio
2. **TTL Optimization**: Balance freshness vs. performance
3. **Key Generation Performance**: Ensure key generation is fast

## Implementation Phases

1. **Phase 1**: Core interfaces and Redis provider
2. **Phase 2**: Policy system and enhanced middleware
3. **Phase 3**: Memory provider and testing infrastructure
4. **Phase 4**: Documentation and service integration examples

## Backwards Compatibility

The enhanced `withCache` middleware will be backward compatible with the existing implementation. Routes that currently use `withCache` for setting cache headers will continue to work without changes.

## Testing Strategy

1. **Unit Tests**: Test each provider implementation
2. **Integration Tests**: Test middleware with different policies
3. **Benchmarks**: Compare performance with and without caching

## Monitoring and Observability

1. Add cache hit/miss metrics to the existing monitoring system
2. Log cache operations at debug level
3. Add cache performance dashboard

## Dependencies

1. Redis client (already in use)
2. No additional dependencies required
