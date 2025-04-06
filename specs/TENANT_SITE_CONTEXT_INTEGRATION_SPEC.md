# Tenant and Site Context Integration Specification

## Overview

This specification outlines the implementation of tenant and site context integration across the DirectoryMonster application. The goal is to ensure that all parts of the application respect the current tenant and site context, with appropriate UI elements and behavior for different user scenarios.

## Requirements

### 1. Context Propagation

1. **Full Page Refresh on Context Change**
   - When a user changes tenant or site, perform a full page refresh
   - This ensures security headers are properly updated
   - Domain/subdomain may change based on site configuration
   - All security gates must be passed through again with new context

2. **Context Persistence**
   - Store tenant and site selections in localStorage
   - Restore selections on page load
   - Include context in all API requests via headers

3. **Context Validation**
   - Validate tenant and site context on all API requests
   - Ensure users only access resources they have permission to
   - Return appropriate error responses for invalid context

### 2. Admin Dashboard Integration

1. **AdminLayout Integration**
   - Wrap AdminLayout with TenantSiteProvider
   - Ensure context is available to all admin components

2. **AdminHeader Integration**
   - Add TenantSelector and SiteSelector to AdminHeader
   - Only show selectors when multiple options are available
   - Show current tenant and site context clearly

3. **Context-Aware Components**
   - Update all admin components to respect tenant and site context
   - Filter data based on current context
   - Show appropriate UI elements based on context

### 3. Main Site Integration

1. **Context-Based Redirection**
   - When changing tenant on main site, redirect to tenant's main site
   - When changing site, redirect to that specific site
   - URLs should reflect the current context (e.g., `/tenant/{id}` or `/site/{id}`)

2. **Domain/Subdomain Handling**
   - Support custom domains or subdomains for different sites
   - Update security headers based on domain
   - Handle cross-domain authentication properly

3. **Public vs. Authenticated Experience**
   - Public users see default public tenant
   - Authenticated users with single tenant see that tenant automatically
   - Multi-tenant users can switch between tenants

### 4. User Experience by Scenario

1. **Single-Tenant Users**
   - No tenant selector shown
   - Site selector only shown if multiple sites exist
   - Simplified UI with no tenant-related options

2. **Multi-Tenant Users**
   - Tenant selector shown
   - Site selector shown when tenant has multiple sites
   - Changing tenant requires full page refresh
   - Changing site requires full page refresh

3. **Public Tenant**
   - Never shown as an editable option
   - All users can view public tenant content
   - Only system admins can edit public tenant

## Technical Implementation

### 1. Context Provider Updates

```tsx
// src/contexts/TenantSiteContext.tsx
export function TenantSiteProvider({ children }: { children: React.ReactNode }) {
  // ... existing state ...

  // Update setCurrentTenantId to trigger page refresh
  const setCurrentTenantId = (id: string | null) => {
    if (id !== currentTenantId) {
      // Save selection to localStorage
      if (id) localStorage.setItem('currentTenantId', id);
      else localStorage.removeItem('currentTenantId');

      // Refresh page to update context
      window.location.reload();
    }
  };

  // Update setCurrentSiteId to trigger page refresh
  const setCurrentSiteId = (id: string | null) => {
    if (id !== currentSiteId && currentTenantId) {
      // Save selection to localStorage
      if (id) localStorage.setItem(`${currentTenantId}_currentSiteId`, id);
      else localStorage.removeItem(`${currentTenantId}_currentSiteId`);

      // Refresh page to update context
      window.location.reload();
    }
  };

  // ... rest of implementation ...
}
```

### 2. API Middleware

```tsx
// src/middleware/withTenantContext.ts
export function withTenantContext(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  // Extract tenant and site IDs from headers or cookies
  const tenantId = req.headers.get('x-tenant-id') || req.cookies.get('currentTenantId')?.value;
  const siteId = req.headers.get('x-site-id') || req.cookies.get(`${tenantId}_currentSiteId`)?.value;

  // Clone request and add context headers
  const requestWithContext = new NextRequest(req);
  if (tenantId) requestWithContext.headers.set('x-tenant-id', tenantId);
  if (siteId) requestWithContext.headers.set('x-site-id', siteId);

  // Pass to handler
  return handler(requestWithContext);
}
```

### 3. API Client Updates

```tsx
// src/lib/api-client.ts
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Get context from localStorage
  const tenantId = localStorage.getItem('currentTenantId');
  const siteId = tenantId ? localStorage.getItem(`${tenantId}_currentSiteId`) : null;

  // Add context headers
  const headers = new Headers(options.headers);
  if (tenantId) headers.set('x-tenant-id', tenantId);
  if (siteId) headers.set('x-site-id', siteId);

  // Make request
  return fetch(endpoint, {
    ...options,
    headers
  });
}
```

### 4. Main Site Redirection

```tsx
// src/contexts/PublicTenantSiteContext.tsx
export function PublicTenantSiteProvider({ children }: { children: React.ReactNode }) {
  // ... existing state ...

  // Handle tenant change with redirection
  const setTenantId = (id: string | null) => {
    if (id !== tenantId) {
      // Save selection
      if (id) localStorage.setItem('currentTenantId', id);
      else localStorage.removeItem('currentTenantId');

      // Redirect to tenant's main site
      if (id) window.location.href = `/tenant/${id}`;
      else window.location.href = '/';
    }
  };

  // Handle site change with redirection
  const setSiteId = (id: string | null) => {
    if (id !== siteId && tenantId) {
      // Save selection
      if (id) localStorage.setItem(`${tenantId}_currentSiteId`, id);
      else localStorage.removeItem(`${tenantId}_currentSiteId`);

      // Redirect to specific site
      if (id) window.location.href = `/site/${id}`;
      else window.location.href = `/tenant/${tenantId}`;
    }
  };

  // ... rest of implementation ...
}
```

## UI Components

### 1. Admin Header with Context Selectors

```tsx
// src/components/admin/layout/AdminHeader.tsx
export function AdminHeader() {
  const { hasMultipleTenants, hasMultipleSites, currentTenant, currentSite } = useTenantSite();

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and hamburger menu */}
          <div className="flex">
            {/* ... existing code ... */}
          </div>

          {/* Context display and selectors */}
          <div className="flex items-center space-x-4">
            {/* Always show current context */}
            <div className="context-display text-sm text-gray-500">
              {currentTenant && (
                <span>Tenant: {currentTenant.name}</span>
              )}
              {currentSite && (
                <span className="ml-2">Site: {currentSite.name}</span>
              )}
            </div>

            {/* Only show selectors when multiple options exist */}
            {hasMultipleTenants && <TenantSelector />}
            {hasMultipleSites && <SiteSelector />}

            {/* User menu, notifications, etc. */}
            {/* ... existing code ... */}
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 2. Context-Aware Admin Components

```tsx
// Example: src/components/admin/listings/ListingList.tsx
export function ListingList() {
  const { currentTenantId, currentSiteId } = useTenantSite();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (currentTenantId) {
      // Fetch listings with context
      fetchListings(currentTenantId, currentSiteId).then(setListings);
    }
  }, [currentTenantId, currentSiteId]);

  return (
    <div className="listing-list">
      <h2>Listings for {currentSiteId ? `Site ${currentSite?.name}` : 'All Sites'}</h2>
      {/* Render listings */}
    </div>
  );
}
```

## Testing Requirements

1. **Unit Tests**
   - Test context providers with different scenarios
   - Test selectors with various tenant/site configurations
   - Test API middleware with different context values

2. **Integration Tests**
   - Test context propagation across page refreshes
   - Test API requests include correct context headers
   - Test redirection behavior on context changes

3. **End-to-End Tests**
   - Test full user flows for different user types
   - Test domain/subdomain handling
   - Test security with different contexts

## Implementation Phases

1. **Phase 1: Context Provider Updates**
   - Update TenantSiteContext with page refresh logic
   - Update PublicTenantSiteContext with redirection logic
   - Test with different user scenarios
   - Implement unified Listing type definition in `src/types/listing.ts`
   - Ensure all components use the unified type definition

2. **Phase 2: Admin Dashboard Integration**
   - Update AdminLayout and AdminHeader
   - Add context display and selectors
   - Test with different tenant/site configurations

3. **Phase 3: API Integration**
   - Create context middleware
   - Update API client
   - Modify API routes to respect context

4. **Phase 4: Main Site Integration**
   - Update main site layout
   - Add redirection logic
   - Test with different user types

5. **Phase 5: Testing and Refinement**
   - Comprehensive testing across all scenarios
   - Fix any issues or edge cases
   - Optimize performance

## Acceptance Criteria

1. **Context Propagation**
   - Tenant and site context is correctly propagated across the application
   - Context changes trigger full page refreshes
   - Security headers are properly updated on context changes

2. **User Experience**
   - Single-tenant users see a simplified UI with no tenant selector
   - Multi-tenant users can switch between tenants
   - Site selector only appears when multiple sites exist

3. **API Integration**
   - All API requests include tenant and site context
   - API responses respect the current context
   - Invalid context results in appropriate error responses

4. **Security**
   - Users can only access resources they have permission to
   - Context validation prevents unauthorized access
   - Security gates are passed through on context changes
