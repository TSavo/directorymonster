# PR: Standardize Tenant Access Middleware Mocks

This PR continues the work on standardizing test mocks in the DirectoryMonster codebase, focusing on the complex NextRequest, NextResponse, and JWT mock patterns in `tests/api/middleware/withTenantAccess.test.ts`.

## Changes

1. **Created Standardized JWT Mock Implementation**
   - Added a new standardized JWT mock implementation in `tests/mocks/lib/auth/jwt.ts`
   - Implemented decode, verify, and sign functions with consistent behavior
   - Added token constants and default payloads for easy reuse

2. **Standardized NextRequest Mocking**
   - Replaced custom NextRequest implementation with `createMockNextRequest` from our standard mocks
   - Eliminated unsafe type casting (as unknown as NextRequest)
   - Added proper header and URL configuration

3. **Standardized NextResponse Mocking**
   - Replaced direct NextResponse.json calls with `mockNextResponseJson`
   - Standardized response handling and expectations
   - Improved test readability and consistency

4. **Re-enabled Previously Skipped Tests**
   - Implemented previously skipped `withTenantContext` tests using standardized mocks
   - Added proper test coverage for tenant context validation
   - Ensured consistent error handling

## Before/After Comparison

### Before:
```typescript
// Helper to create a mock NextRequest
const createMockRequest = (headers: Record<string, string>, url = 'http://localhost:3000/api/test') => {
  return {
    headers: {
      get: jest.fn().mockImplementation((name) => headers[name] || null),
    },
    url,
    clone: jest.fn().mockReturnThis()
  } as unknown as NextRequest;
};

// Test implementation
it('should reject requests without tenant ID', async () => {
  const req = createMockRequest({});
  const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

  await withTenantAccess(req, handler);

  expect(NextResponse.json).toHaveBeenCalledWith(
    expect.objectContaining({ error: 'Missing tenant context' }),
    expect.objectContaining({ status: 400 })
  );
  expect(handler).not.toHaveBeenCalled();
});
```

### After:
```typescript
// Using standardized request mock
it('should reject requests without tenant ID', async () => {
  // Create a request without a tenant ID
  const req = createMockNextRequest({
    headers: { 'x-tenant-id': undefined }
  });
  
  const handler = jest.fn().mockResolvedValue(
    mockNextResponseJson({ success: true })
  );

  await withTenantAccess(req, handler);

  expect(mockNextResponseJson).toHaveBeenCalledWith(
    expect.objectContaining({ error: 'Missing tenant context' }),
    expect.objectContaining({ status: 400 })
  );
  expect(handler).not.toHaveBeenCalled();
});
```

## Benefits

1. **Improved Test Reliability**: Standardized mocks provide consistent behavior across tests
2. **Reduced Code Duplication**: Eliminates redundant mock implementations
3. **Better Developer Experience**: Makes tests easier to read and maintain
4. **More Accurate Testing**: Ensures tests faithfully represent the middleware behavior
5. **Future Maintainability**: Changes to mock behavior only need to be made in one place

## Testing

The updated tests have been verified to pass and provide the same coverage as the original tests. The standardized mocks provide a more consistent and reliable testing experience.

## Next Steps

1. Continue standardizing mocks in other test files, focusing next on:
   - `tests/unit/middleware/secure-tenant-context.test.ts`

2. Add comprehensive documentation for JWT mock usage

## References

- Related to Issue #52: Complete Tenant Membership Service ACL Integration
- Builds on PR #72: Initial Mock Standardization Implementation
