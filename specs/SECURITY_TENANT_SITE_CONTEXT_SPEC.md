# Security and Tenant/Site Context Integration Specification

## Overview

This specification outlines the security improvements and tenant/site context integration implemented in PR #323. These changes enhance the application's security posture by implementing robust tenant isolation, improving permission checks, and providing a consistent UI for tenant and site selection.

## Table of Contents

1. [Security Improvements](#security-improvements)
   1. [Tenant Context Security](#tenant-context-security)
   2. [Permission Middleware Enhancements](#permission-middleware-enhancements)
   3. [Cross-Tenant Attack Prevention](#cross-tenant-attack-prevention)
   4. [Audit Logging](#audit-logging)

2. [Tenant/Site Context Integration](#tenantsite-context-integration)
   1. [Context Architecture](#context-architecture)
   2. [UI Components](#ui-components)
   3. [Context Persistence](#context-persistence)

3. [Implementation Details](#implementation-details)
   1. [File Changes](#file-changes)
   2. [New Components](#new-components)
   3. [Modified Components](#modified-components)

4. [Testing Requirements](#testing-requirements)
   1. [Unit Tests](#unit-tests)
   2. [Integration Tests](#integration-tests)
   3. [Security Tests](#security-tests)

## Security Improvements

### Tenant Context Security

The PR implements a secure tenant context system that prevents unauthorized cross-tenant access and ensures proper tenant isolation throughout the application.

#### TenantContext Class

```typescript
// src/app/api/middleware/secureTenantContext.ts
export class TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly requestId: string;
  readonly timestamp: number;
  
  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.requestId = uuidv4(); // Generate unique request ID for audit trail
    this.timestamp = Date.now(); // Timestamp for request tracing
  }
  
  // Static factory method to create context from request
  static async fromRequest(req: NextRequest): Promise<TenantContext | null> {
    // Extract tenant ID and validate user membership
    // Return null if validation fails
  }
}
```

#### Key Security Features

1. **Request ID Generation**: Each tenant context includes a unique request ID for audit trail and tracing
2. **Timestamp Tracking**: Timestamps are recorded for security event correlation
3. **User-Tenant Validation**: Verifies that the user belongs to the requested tenant
4. **Path Segment Analysis**: Detects and blocks attempts to access resources from other tenants

### Permission Middleware Enhancements

The PR consolidates and enhances permission middleware to ensure consistent security checks across all API endpoints.

#### withSecureTenantPermission Middleware

```typescript
// src/app/api/middleware/withPermission.ts
export async function withSecureTenantPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  // Create secure tenant context
  // Validate user has required permission
  // Call handler with validated request and context
}
```

#### Key Enhancements

1. **Combined Security Checks**: Integrates tenant validation and permission checks in a single middleware
2. **Resource-Specific Permissions**: Supports checking permissions for specific resource instances
3. **Detailed Error Messages**: Provides clear error messages with context about the denied permission
4. **Audit Logging**: Records permission check failures for security monitoring

### Cross-Tenant Attack Prevention

The PR implements multiple layers of defense to prevent cross-tenant attacks and data leakage.

#### Security Measures

1. **Path Segment Analysis**: Detects and blocks attempts to access resources from other tenants via URL manipulation
2. **Tenant ID Validation**: Verifies tenant IDs in requests match the authenticated user's context
3. **Request Cloning**: Creates new request objects with validated tenant context to prevent header spoofing
4. **Error Handling**: Catches and properly handles exceptions in security-critical code

### Audit Logging

The PR enhances audit logging for security events to provide better visibility into potential security issues.

#### New Audit Events

1. **CROSS_SITE_ACCESS_ATTEMPT**: Logged when a user attempts to access a site they don't have permission for
2. **UNAUTHORIZED_TENANT_ACCESS**: Logged when a user attempts to access a tenant they don't belong to
3. **PERMISSION_DENIED**: Logged when a permission check fails

## Tenant/Site Context Integration

### Context Architecture

The PR implements a comprehensive tenant and site context system that maintains context across the application.

#### TenantSiteContext

```typescript
// src/contexts/TenantSiteContext.tsx
export interface TenantSiteContextType {
  tenants: Tenant[];
  sites: Site[];
  currentTenantId: string | null;
  currentSiteId: string | null;
  setCurrentTenantId: (tenantId: string) => void;
  setCurrentSiteId: (siteId: string) => void;
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;
  loading: boolean;
}
```

#### Key Features

1. **Context Provider**: Provides tenant and site context to all components
2. **Local Storage Persistence**: Maintains selected tenant and site across page refreshes
3. **Multiple Entity Detection**: Detects when a user has access to multiple tenants or sites
4. **Loading State Management**: Handles loading states for asynchronous context operations

### UI Components

The PR adds UI components for tenant and site selection to provide a consistent user experience.

#### TenantSelector Component

```typescript
// src/components/admin/tenant/TenantSelector.tsx
export function TenantSelector() {
  const { 
    tenants, 
    currentTenantId, 
    setCurrentTenantId, 
    loading 
  } = useTenantSite();
  
  // Render dropdown for tenant selection
}
```

#### SiteSelector Component

```typescript
// src/components/admin/tenant/SiteSelector.tsx
export function SiteSelector() {
  const { 
    sites, 
    currentSiteId, 
    setCurrentSiteId, 
    loading 
  } = useTenantSite();
  
  // Render dropdown for site selection
}
```

### Context Persistence

The PR implements mechanisms to persist tenant and site context across page refreshes and navigation.

#### Local Storage Integration

```typescript
// src/contexts/TenantSiteContext.tsx
// Save tenant selection to localStorage
useEffect(() => {
  if (currentTenantId) {
    localStorage.setItem('currentTenantId', currentTenantId);
  }
}, [currentTenantId]);

// Save site selection to localStorage
useEffect(() => {
  if (currentSiteId) {
    localStorage.setItem('currentSiteId', currentSiteId);
  }
}, [currentSiteId]);
```

#### API Request Integration

```typescript
// src/lib/api-client.ts
export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  // Get tenant and site context from localStorage
  const tenantId = localStorage.getItem('currentTenantId');
  const siteId = localStorage.getItem('currentSiteId');
  
  // Add headers to request
  const headers = new Headers(options.headers || {});
  if (tenantId) headers.set('x-tenant-id', tenantId);
  if (siteId) headers.set('x-site-id', siteId);
  
  // Make request with context headers
}
```

## Implementation Details

### File Changes

#### New Files

1. **src/app/api/middleware/secureTenantContext.ts**: Implements secure tenant context middleware
2. **src/contexts/TenantSiteContext.tsx**: Implements tenant/site context provider
3. **src/components/admin/tenant/TenantSelector.tsx**: Implements tenant selection UI
4. **src/components/admin/tenant/SiteSelector.tsx**: Implements site selection UI
5. **src/hooks/useTenantSite.ts**: Custom hook for accessing tenant/site context

#### Modified Files

1. **src/app/api/middleware/index.ts**: Updates middleware exports
2. **src/app/api/middleware/withPermission.ts**: Enhances permission middleware
3. **src/components/admin/layout/AdminHeader.tsx**: Adds tenant/site selectors to header
4. **src/lib/api-client.ts**: Adds tenant/site context to API requests
5. **src/middleware.ts**: Updates middleware for tenant/site context

### New Components

1. **TenantSiteProvider**: Context provider for tenant and site selection
2. **TenantSelector**: UI component for selecting a tenant
3. **SiteSelector**: UI component for selecting a site
4. **TenantSiteContext**: React context for tenant and site data

### Modified Components

1. **AdminHeader**: Updated to include tenant and site selectors
2. **AdminLayout**: Updated to wrap content in TenantSiteProvider
3. **ApiClient**: Updated to include tenant and site context in requests

## Testing Requirements

### Unit Tests

1. **TenantContext Tests**:
   - Test creation of TenantContext instances
   - Test fromRequest method with valid and invalid inputs
   - Test path segment analysis for cross-tenant detection

2. **Permission Middleware Tests**:
   - Test withSecureTenantPermission with various permission scenarios
   - Test error handling for invalid permissions
   - Test resource-specific permission checks

3. **UI Component Tests**:
   - Test TenantSelector rendering and interaction
   - Test SiteSelector rendering and interaction
   - Test context updates when selections change

### Integration Tests

1. **Context Persistence Tests**:
   - Test localStorage persistence across page navigation
   - Test API request header inclusion
   - Test context restoration on page load

2. **Cross-Component Tests**:
   - Test AdminHeader with TenantSelector and SiteSelector
   - Test AdminLayout with TenantSiteProvider
   - Test API client with tenant/site context

### Security Tests

1. **Cross-Tenant Access Tests**:
   - Test attempts to access resources from another tenant
   - Test URL manipulation for tenant ID injection
   - Test header spoofing for tenant context

2. **Permission Boundary Tests**:
   - Test access to resources with insufficient permissions
   - Test access to resources in unauthorized tenants
   - Test access to resources in unauthorized sites

3. **Audit Logging Tests**:
   - Test logging of security events
   - Test correlation of events with request IDs
   - Test timestamp accuracy for event sequencing
