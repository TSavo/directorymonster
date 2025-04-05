# Tenant and Site Selection UI Specification

## Overview

This specification outlines the implementation of tenant and site selection UI components for the DirectoryMonster admin dashboard. These components will allow users to navigate between tenants and sites they have access to, with appropriate UI elements appearing only when relevant.

## Requirements

1. **Tenant Selection**
   - Only display tenant selection UI if the user has access to multiple tenants (excluding the default public tenant)
   - Do not show the default public tenant as an editable option
   - Remember the user's tenant selection across sessions
   - Provide clear visual indication of the currently selected tenant

2. **Site Selection**
   - Sites are always tenant-specific
   - Display site selection UI only when the user has access to multiple sites within the current tenant
   - Administration is always at the site level (no "all sites" option)
   - Remember the user's site selection per tenant across sessions
   - Provide clear visual indication of the currently selected site

3. **Context Awareness**
   - All admin operations should respect the current tenant and site context
   - API requests should include appropriate tenant and site identifiers
   - Error states should be handled gracefully when tenant or site context is missing

## Component Specifications

### TenantSelector Component

```tsx
// src/components/admin/tenant/TenantSelector.tsx
interface TenantSelectorProps {
  // Optional className for styling
  className?: string;
}

export function TenantSelector({ className }: TenantSelectorProps) {
  // Component should:
  // 1. Fetch tenants the user has access to
  // 2. Filter out the default public tenant
  // 3. Only render if user has access to multiple tenants
  // 4. Allow selecting a tenant from a dropdown
  // 5. Persist selection in localStorage
  // 6. Trigger context update when selection changes
}
```

### SiteSelector Component

```tsx
// src/components/admin/tenant/SiteSelector.tsx
interface SiteSelectorProps {
  // Optional className for styling
  className?: string;
}

export function SiteSelector({ className }: SiteSelectorProps) {
  // Component should:
  // 1. Fetch sites for the current tenant
  // 2. Only render if user has access to multiple sites
  // 3. Allow selecting a site from a dropdown
  // 4. Persist selection in localStorage (per tenant)
  // 5. Trigger context update when selection changes
}
```

### TenantSiteContext

```tsx
// src/contexts/TenantSiteContext.tsx
interface TenantSiteContextType {
  currentTenantId: string | null;
  currentSiteId: string | null;
  setCurrentTenantId: (id: string | null) => void;
  setCurrentSiteId: (id: string | null) => void;
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;
  tenants: Tenant[];
  sites: Site[];
  loading: boolean;
}

export function TenantSiteProvider({ children }: { children: ReactNode }) {
  // Provider should:
  // 1. Load user's accessible tenants
  // 2. Filter out the default public tenant
  // 3. Determine if user has multiple tenants
  // 4. Load sites for the selected tenant
  // 5. Determine if tenant has multiple sites
  // 6. Manage tenant and site selection state
  // 7. Persist selections in localStorage
}

export function useTenantSite() {
  // Hook to access the tenant/site context
}
```

### AdminHeader Integration

```tsx
// src/components/admin/layout/AdminHeader.tsx
export function AdminHeader({ toggleSidebar }: AdminHeaderProps) {
  // Header should:
  // 1. Include TenantSelector only if user has multiple tenants
  // 2. Include SiteSelector only if current tenant has multiple sites
  // 3. Position selectors appropriately in the header
  // 4. Ensure selectors are responsive on mobile
}
```

## UI/UX Guidelines

1. **Visual Hierarchy**
   - Tenant selector should be more prominent than site selector
   - Current selections should be clearly visible
   - Use consistent styling with the rest of the admin UI

2. **Interaction Design**
   - Dropdowns should open on click
   - Selection should take effect immediately
   - Include loading states during context transitions
   - Provide visual feedback on selection change

3. **Responsive Design**
   - On mobile, selectors may collapse into a more compact form
   - Consider using a modal selector on very small screens
   - Ensure touch targets are appropriately sized

4. **Accessibility**
   - All components must be keyboard navigable
   - Include appropriate ARIA attributes
   - Ensure sufficient color contrast
   - Provide screen reader friendly text alternatives

## Technical Implementation

1. **Data Flow**
   - User authentication → Load tenants → Select tenant → Load sites → Select site
   - Context changes trigger data refetching in relevant components
   - API requests include tenant and site headers

2. **State Management**
   - Use React Context for global tenant/site state
   - Use localStorage for persistence across sessions
   - Include loading states to handle asynchronous operations

3. **API Integration**
   - Add tenant and site headers to all admin API requests
   - Handle authorization errors when context is invalid
   - Implement proper error boundaries for context-related failures

## Testing Requirements

1. **Unit Tests**
   - Test TenantSelector and SiteSelector components in isolation
   - Test context provider with various tenant/site configurations
   - Test persistence mechanisms

2. **Integration Tests**
   - Test tenant and site selection flow end-to-end
   - Verify context is properly passed to child components
   - Test API requests include correct tenant and site headers

3. **Edge Cases**
   - Test behavior when user has access to only one tenant
   - Test behavior when tenant has only one site
   - Test error handling when tenant or site becomes inaccessible

## Implementation Phases

1. **Phase 1: Core Context**
   - Implement TenantSiteContext provider
   - Create basic selector components
   - Add persistence layer

2. **Phase 2: UI Integration**
   - Integrate selectors into AdminHeader
   - Implement responsive design
   - Add loading states and error handling

3. **Phase 3: API Integration**
   - Update API client to include tenant and site headers
   - Implement error handling for context-related API failures
   - Add automatic context refresh mechanisms

4. **Phase 4: Testing & Refinement**
   - Implement comprehensive test suite
   - Gather user feedback
   - Refine UI/UX based on feedback

## Acceptance Criteria

1. Tenant selector only appears for users with multiple tenants
2. Site selector only appears when current tenant has multiple sites
3. Default public tenant is not shown as an editable option
4. Selections persist across browser sessions
5. All admin operations respect the current tenant and site context
6. UI is responsive and accessible
7. Comprehensive test coverage is implemented
