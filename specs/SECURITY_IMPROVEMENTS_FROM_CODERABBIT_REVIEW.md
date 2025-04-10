# Security Improvements from CodeRabbit Review

## Overview

This specification outlines the security improvements and code quality enhancements identified during the CodeRabbit review of PR #321 (Implement Tenant-Site Context Integration with Unified Authentication). The document details specific issues, their locations in the codebase, and recommended solutions.

## Core Issues

### 1. URL Validation for Redirects

**Issue**: The current implementation does not validate `returnUrl` parameters, creating potential open redirect vulnerabilities.

**Affected Files**:
- `src/app/api/auth/verify/route.ts` (indirectly)
- `src/components/auth/AuthContainer.tsx`
- Related authentication components

**Recommended Solution**:
```typescript
// Create a utility function in src/utils/url-validator.ts
export function isValidReturnUrl(url: string): boolean {
  // Only allow relative URLs (starting with /)
  if (!url.startsWith('/')) {
    return false;
  }
  
  // Disallow URLs with protocol-relative notation
  if (url.startsWith('//')) {
    return false;
  }
  
  // Optional: Add a whitelist of allowed paths
  const allowedPaths = ['/admin', '/dashboard', '/profile', '/listings'];
  const isAllowedPath = allowedPaths.some(path => url.startsWith(path));
  
  return isAllowedPath;
}

// Then use this function in authentication components:
if (returnUrl && isValidReturnUrl(returnUrl)) {
  router.push(decodeURIComponent(returnUrl));
} else {
  router.push(redirectPath);
}
```

### 2. Error Handling in Middleware

**Issue**: The `validateTenantSiteContext` middleware lacks proper error handling for exceptions thrown from `withTenantSiteContext`.

**Affected Files**:
- `src/app/api/middleware/validateTenantSiteContext.ts`

**Recommended Solution**:
```typescript
export const validateTenantSiteContext = async (
  req: NextRequest,
  handler: RouteHandler
): Promise<NextResponse> => {
  try {
    return await withTenantSiteContext(req, handler);
  } catch (error) {
    console.error('Error in tenant-site context middleware:', error);
    return NextResponse.json(
      { error: 'Error processing tenant-site context' },
      { status: 500 }
    );
  }
};
```

### 3. Missing Enum Value

**Issue**: The `AuditAction.CROSS_SITE_ACCESS_ATTEMPT` enum value is missing from the `AuditAction` enum.

**Affected Files**:
- `src/lib/audit/types.ts`
- `src/lib/audit/__mocks__/audit-service.ts`

**Recommended Solution**:
```typescript
// In src/lib/audit/types.ts
export enum AuditAction {
  // existing values...
  CROSS_SITE_ACCESS_ATTEMPT,
}

// In src/lib/audit/__mocks__/audit-service.ts
export const AuditService = {
  logSecurityEvent: jest.fn().mockResolvedValue(true),
  logAuditEvent: jest.fn().mockResolvedValue(true),
  getAuditEvents: jest.fn().mockResolvedValue([]),
  logCrossSiteAccessAttempt: jest.fn().mockResolvedValue(true)
};
```

### 4. Pagination Implementation

**Issue**: Several endpoints return potentially large datasets without pagination, which could lead to performance issues.

**Affected Files**:
- `src/app/api/admin/roles/global/[id]/users/route.ts`
- `src/lib/role/role-service.ts`

**Recommended Solution**:
```typescript
// Update RoleService.getUsersWithGlobalRole in src/lib/role/role-service.ts
static async getUsersWithGlobalRole(
  roleId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ users: string[], total: number }> {
  // Validate pagination parameters
  if (page < 1 || pageSize < 1 || pageSize > 100) {
    throw new Error('Invalid pagination parameters');
  }

  // Calculate offset
  const offset = (page - 1) * pageSize;

  // Get total count
  const allUsers = await db.userRole.findMany({
    where: { roleId },
    select: { userId: true }
  });
  const total = allUsers.length;

  // Get paginated results
  const paginatedUsers = await db.userRole.findMany({
    where: { roleId },
    select: { userId: true },
    skip: offset,
    take: pageSize
  });

  return {
    users: paginatedUsers.map(ur => ur.userId),
    total
  };
}

// Then update the API route in src/app/api/admin/roles/global/[id]/users/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const roleId = params.id;
        // Extract pagination parameters from URL
        const url = new URL(validatedReq.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
        
        // Validate pagination parameters
        if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
          return NextResponse.json(
            { error: 'Invalid pagination parameters' },
            { status: 400 }
          );
        }

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        // Get users with this role
        const { users, total } = await RoleService.getUsersWithGlobalRole(roleId, page, pageSize);
        
        // Add pagination metadata to the response
        const totalPages = Math.ceil(total / pageSize);

        return NextResponse.json({
          users,
          pagination: {
            page,
            pageSize,
            total,
            totalPages
          }
        });
      } catch (error) {
        console.error(`Error retrieving users with global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to get users with global role' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
```

## Code Quality Improvements

### 1. Token Decoding Utility

**Issue**: Token decoding logic is duplicated in multiple places.

**Affected Files**:
- `src/contexts/AuthContext.tsx`

**Recommended Solution**:
```typescript
// Create a utility function in src/utils/token-utils.ts
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Then use this function in AuthContext.tsx and other places
const payload = decodeToken(token);
if (payload?.user) {
  setUser(payload.user);
}
```

### 2. Improved Test Coverage

**Issue**: Some tests only verify structure but not functionality.

**Affected Files**:
- `src/components/admin/security/hooks/__tests__/useSecurityMetrics.test.ts`
- Other test files

**Recommended Solution**:
```typescript
// Example of improved test for useSecurityMetrics.test.ts
it('should update data when date range changes', async () => {
  // Mock fetch responses
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ metrics: mockMetrics1 })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ metrics: mockMetrics2 })
    });

  const { result, waitForNextUpdate, rerender } = renderHook(
    (props) => useSecurityMetrics(props),
    { initialProps: { startDate: '2023-01-01', endDate: '2023-01-31' } }
  );

  // Wait for initial data load
  await waitForNextUpdate({ timeout: 1000 });

  // Verify initial data
  expect(result.current.isLoading).toBe(false);
  expect(result.current.metrics).toEqual(mockMetrics1);

  // Change date range
  rerender({ startDate: '2023-02-01', endDate: '2023-02-28' });

  // Verify API call was made with updated parameters
  expect(global.fetch).toHaveBeenLastCalledWith(
    '/api/admin/security/metrics?startDate=2023-02-01&endDate=2023-02-28',
    expect.anything()
  );
  
  // Wait for the loading to complete and data to update
  await waitForNextUpdate({ timeout: 1000 });
  
  // Verify the updated data
  expect(result.current.isLoading).toBe(false);
  expect(result.current.metrics?.totalAttempts).toBe(200);
});
```

### 3. Form Validation

**Issue**: IP address inputs lack format validation.

**Affected Files**:
- `src/components/admin/security/ReportSuspiciousActivity.tsx`

**Recommended Solution**:
```typescript
// Add to the form validation in ReportSuspiciousActivity.tsx
interface FormErrors {
  activityType?: string;
  description?: string;
  ip?: string;
}

const validateForm = (): boolean => {
  const newErrors: FormErrors = {};
  
  // ... existing validation
  
  // Validate IP address format if provided
  if (formData.ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ip)) {
    newErrors.ip = 'Please enter a valid IPv4 address';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Update the input element
<input
  type="text"
  id="ip"
  name="ip"
  value={formData.ip}
  onChange={handleChange}
  placeholder="e.g., 192.168.1.1"
  className={`block w-full rounded-md border ${
    errors.ip ? 'border-red-300' : 'border-gray-300'
  } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
  aria-invalid={errors.ip ? 'true' : 'false'}
/>
{errors.ip && (
  <p className="mt-1 text-sm text-red-600">{errors.ip}</p>
)}
```

### 4. Error Handling for Missing API Tokens

**Issue**: Mapbox component doesn't handle missing tokens gracefully.

**Affected Files**:
- `src/components/admin/security/LoginAttemptsMap.tsx`

**Recommended Solution**:
```typescript
// In LoginAttemptsMap.tsx
// Check if Mapbox token is available
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!mapboxToken) {
  return (
    <div className="h-96 flex items-center justify-center">
      <div className="text-center text-red-500">
        <p>Map configuration error: Missing Mapbox token.</p>
      </div>
    </div>
  );
}

return (
  <div className="h-96 relative">
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={mapboxToken}
      onError={(e) => {
        console.error('Mapbox error:', e);
        // Optionally update state here to show fallback UI
      }}
      ref={mapRef}
      style={{ width: '100%', height: '100%', borderRadius: '0.375rem' }}
    />
  </div>
);
```

## User Experience Improvements

### 1. Smooth Context Transitions

**Issue**: Tenant/site selection forces page refresh, creating a jarring user experience.

**Affected Files**:
- `src/contexts/TenantSiteContext.tsx`

**Recommended Solution**:
```typescript
// In TenantSiteContext.tsx
const setCurrentTenantId = (id: string | null) => {
  if (id !== currentTenantId) {
    // Save selection to localStorage
    if (id) localStorage.setItem('currentTenantId', id);
    else localStorage.removeItem('currentTenantId');

    // Update state
    setCurrentTenantIdState(id);
    
    // Load sites for the new tenant
    if (id) {
      loadSitesForTenant(id);
    }
  }
};

const setCurrentSiteId = (id: string | null) => {
  if (id !== currentSiteId && currentTenantId) {
    // Save selection to localStorage
    if (id) localStorage.setItem(`${currentTenantId}_currentSiteId`, id);
    else localStorage.removeItem(`${currentTenantId}_currentSiteId`);

    // Update state
    setCurrentSiteIdState(id);
  }
};
```

### 2. Form Submission Throttling

**Issue**: Form submissions lack throttling to prevent abuse.

**Affected Files**:
- `src/components/admin/security/ReportSuspiciousActivity.tsx`

**Recommended Solution**:
```typescript
// In ReportSuspiciousActivity.tsx
export const ReportSuspiciousActivity: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    activityType: '',
    ip: '',
    username: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
  const THROTTLE_TIME_MS = 30000; // 30 seconds between submissions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Check if submission is throttled
    if (lastSubmitTime && Date.now() - lastSubmitTime < THROTTLE_TIME_MS) {
      setSubmitError(
        `Please wait ${Math.ceil(
          (THROTTLE_TIME_MS - (Date.now() - lastSubmitTime)) / 1000
        )} seconds before submitting again`
      );
      return;
    }
  
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);
  
    try {
      // ... existing code
  
      setSubmitSuccess(true);
      setLastSubmitTime(Date.now());
  
      // ... rest of the function
    } catch (error) {
      // Handle error accordingly
    }
  };

  // ...rest of the component
};
```

## Implementation Plan

### Phase 1: Critical Security Fixes

1. Add URL validation for redirects
2. Add error handling to middleware
3. Add missing enum value
4. Implement pagination for large datasets

### Phase 2: Code Quality Improvements

1. Create token decoding utility
2. Improve test coverage
3. Add form validation
4. Add error handling for missing API tokens

### Phase 3: User Experience Improvements

1. Implement smooth context transitions
2. Add form submission throttling

## Testing Strategy

1. **Unit Tests**:
   - Test URL validation function with various inputs
   - Test error handling in middleware
   - Test pagination implementation
   - Test form validation

2. **Integration Tests**:
   - Test authentication flow with URL validation
   - Test API endpoints with pagination
   - Test form submission with throttling

3. **Security Tests**:
   - Test for open redirect vulnerabilities
   - Test for cross-site access attempts
   - Test for rate limiting effectiveness

## Success Criteria

1. All identified security vulnerabilities are addressed
2. Code quality issues are resolved
3. User experience is improved
4. All tests pass
5. No new issues are introduced

## Related Issues

- PR #321: Implement Tenant-Site Context Integration with Unified Authentication
- Issue #315: Implement Tenant and Site Context Integration
- Issue #316: Security: Implement consistent site context in permission checks
- Issue #317: Comprehensive ACL Audit and Implementation
