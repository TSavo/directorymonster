# API Service Layer Standardization Specification

## Overview

This specification outlines the requirements and implementation approach for standardizing the service layer across all API endpoints in DirectoryMonster. Currently, there's inconsistent use of service classes, with some APIs directly accessing the Redis client while others use proper service abstraction.

## Motivation

As we move toward a Kubernetes-based architecture with separate frontend and backend services, it's critical that all API endpoints use a consistent service layer approach for several reasons:

1. **Distributed Data Access**: Backend services may not have direct access to Redis in the future
2. **Separation of Concerns**: Clear separation between API routes, business logic, and data access
3. **Code Maintainability**: Consistent patterns make the codebase easier to maintain
4. **Testability**: Service abstractions are easier to mock and test
5. **Scalability**: Services can be independently scaled and evolved

## Current State

Currently, the codebase demonstrates inconsistent patterns:

1. **Admin APIs**: Mostly use service classes (CategoryService, TenantService, etc.)
2. **Non-Admin APIs**: Many directly access Redis via the `kv` client
3. **Mixed Approach**: Some APIs use middleware but no service layer

## Target Architecture

```
API Routes → Services → Data Access Layer
```

1. **API Routes**:
   - Handle HTTP requests/responses
   - Parse input parameters
   - Apply middleware (auth, validation)
   - Call appropriate service methods
   - Format response

2. **Services**:
   - Implement business logic
   - Coordinate between multiple data sources
   - Handle tenant validation
   - Enforce permissions
   - Return domain objects

3. **Data Access Layer**:
   - Abstract database interactions
   - Handle connection management
   - Implement caching
   - Transaction management

## Implementation Requirements

### 1. Service Class Structure

All service classes should follow a consistent pattern:

```typescript
export class ExampleService {
  // Static methods for service functionality
  static async getById(id: string, tenantId: string): Promise<Example | null> {
    // Implementation
  }
  
  static async create(data: ExampleData, tenantId: string): Promise<Example> {
    // Implementation
  }
  
  // More methods...
}
```

### 2. Tenant Validation

All service methods must validate tenant access before returning or manipulating data:

```typescript
static async getByIdWithTenantValidation(
  id: string,
  tenantId: string
): Promise<Resource | null> {
  const resource = await dataAccess.getById(id);
  
  // Return null if resource doesn't exist or belongs to another tenant
  if (!resource || resource.tenantId !== tenantId) {
    return null;
  }
  
  return resource;
}
```

### 3. Required Service Classes

The following service classes must be implemented or refactored:

1. **SearchService**
   - Replace direct `searchIndexer` calls
   - Handle search queries with tenant context

2. **SiteService**
   - Handle site creation, retrieval, and management
   - Replace direct Redis access in site-related APIs

3. **AuthService**
   - Handle authentication logic
   - Token management and validation

4. **UserService**
   - User management operations
   - Password reset, confirmation flows

5. **TenantService**
   - Tenant management and validation
   - Cross-tenant operations

6. **ListingService**
   - Listing CRUD operations
   - Listing search and filtering

7. **CategoryService** (already exists but may need refactoring)
   - Category CRUD operations
   - Category ordering and hierarchy

### 4. API Route Implementation

All API routes should be refactored to use services:

```typescript
export const GET = withRedis(async (request: NextRequest) => {
  // Extract parameters
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const tenantId = searchParams.get('tenantId');
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }
  
  try {
    // Call service instead of direct data access
    const results = await SearchService.search(
      tenantId,
      query,
      {
        // Additional parameters...
      }
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
});
```

### 5. Data Access Abstraction

Consider implementing a data access layer that abstracts Redis operations:

```typescript
export class RedisDataAccess {
  static async get<T>(key: string): Promise<T | null> {
    return kv.get<T>(key);
  }
  
  static async set<T>(key: string, value: T): Promise<void> {
    return kv.set(key, value);
  }
  
  // Additional methods...
}
```

This abstraction will make it easier to switch data stores or implement more complex data access patterns in the future.

## Migration Strategy

1. **Identify All API Endpoints**:
   - Catalog all existing endpoints
   - Determine which ones need refactoring

2. **Create Missing Service Classes**:
   - Implement service classes for each domain area
   - Ensure tenant validation in all methods

3. **Refactor API Routes**:
   - Update each route to use service classes
   - Remove direct Redis access

4. **Testing**:
   - Unit test all service classes
   - Integration test API endpoints
   - Verify tenant isolation

## Implementation Priority

1. **Critical APIs First**:
   - User-facing search and listing APIs
   - Authentication endpoints
   - Site information APIs

2. **Admin APIs Second**:
   - Review and strengthen existing service use
   - Refactor any that directly access Redis

3. **Utility APIs Last**:
   - Debug endpoints
   - Health checks
   - Testing utilities

## Future Considerations

1. **Service Location**:
   - Services may need to be moved to a separate package/repository
   - Consider packaging services for reuse across projects

2. **Remote Service Calls**:
   - Prepare for eventual migration to remote service calls
   - Consider implementing service interface contracts

3. **Caching Strategy**:
   - Implement consistent caching within services
   - Consider distributed caching solutions

4. **Error Handling**:
   - Standardize error handling across services
   - Create error types for different failure scenarios

This standardization is a prerequisite for the successful implementation of our Kubernetes-based theming architecture, as it establishes clear boundaries between different system components and ensures all API endpoints follow consistent patterns for data access and business logic.
