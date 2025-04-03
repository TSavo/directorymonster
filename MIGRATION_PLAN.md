# API Migration Plan

## Current State

The current implementation of the listings API uses direct Redis access through the `kv` client:

```
/api/sites/[siteSlug]/listings (using direct kv access)
```

## Target State

We want to migrate to a service-based architecture with a more RESTful API structure:

```
/api/sites/[siteSlug]/categories/[categorySlug]/listings (using ListingService and CategoryService)
```

## Migration Steps

1. **Implement Service Layer**
   - ✅ Create `ListingService` with methods for retrieving, filtering, and paginating listings
   - ✅ Create `CategoryService` with methods for retrieving categories
   - ✅ Create `SiteService` with methods for retrieving sites

2. **Implement New API Endpoints**
   - ✅ Create `/api/sites/[siteSlug]/categories/[categorySlug]/listings` endpoint

3. **Test New Endpoints**
   - ✅ Write tests for `/api/sites/[siteSlug]/categories/[categorySlug]/listings` endpoint

4. **Remove Old Implementation**
   - ✅ Remove the old `/api/sites/[siteSlug]/listings` endpoint
   - ⬜ Update any client code that might be using the old API structure

5. **Documentation**
   - ✅ Create README.md documenting the new API structure

## Benefits of New Architecture

1. **Better Separation of Concerns**
   - Services handle data access and business logic
   - API endpoints handle request/response formatting

2. **More Maintainable Code**
   - Smaller, focused components
   - Easier to test
   - Easier to extend

3. **More RESTful API Structure**
   - Resources are organized in a hierarchical structure
   - URLs clearly represent the resource hierarchy

4. **Better Error Handling**
   - Consistent error responses
   - Better logging

## Rollback Plan

If issues are encountered:
1. Revert the rename of `route-service.ts` to `route.ts`
2. Keep both implementations running in parallel until issues are resolved
