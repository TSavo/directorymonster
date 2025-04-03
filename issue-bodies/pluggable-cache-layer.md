# Implement Pluggable Cache Layer for API Middleware

## Description
Extend the recently added `withCache` API middleware to include a pluggable cache layer with support for per-service cache policies. The current implementation only sets cache control headers but doesn't actually cache responses.

## Objectives
- Create a standardized cache provider interface
- Implement multiple cache backends (Redis, Memory, No-op)
- Design a flexible cache policy system for per-service configuration
- Extend the `withCache` middleware to use these components
- Provide examples for common caching scenarios

## Technical Details
- See the full specification at [specs/cache/pluggable-cache-layer.md](../specs/cache/pluggable-cache-layer.md)
- Will build on top of the existing Redis cache in `src/lib/redis-cache.ts`
- Follows the existing middleware pattern in `src/app/api/middleware/`

## Implementation Tasks
1. **Cache Provider Interface**
   - Define the `CacheProvider` interface
   - Adapt existing `redisCache` to implement this interface
   - Create `MemoryCacheProvider` for development/testing
   - Create `NoOpCacheProvider` for disabling caching

2. **Cache Policy System**
   - Define policy interfaces
   - Create standard policy presets
   - Implement policy resolution based on service or route

3. **Enhanced `withCache` Middleware**
   - Update middleware to support pluggable cache providers
   - Add policy support
   - Implement cache key generation
   - Add debug headers

4. **Service Integration**
   - Add example service policies
   - Implement cache invalidation in mutation operations

5. **Documentation & Testing**
   - Write comprehensive tests
   - Create usage documentation
   - Add monitoring for cache performance

## Definition of Done
- All interfaces and implementations complete
- Unit and integration tests passing
- Documentation updated
- Example service integration
- Performance benchmarks show improvement

## Related Issues
- Currently builds on top of PR #XX (withCache middleware)