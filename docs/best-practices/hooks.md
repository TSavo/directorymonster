# Hook Best Practices

This document outlines best practices for creating and using hooks in our application.

## Naming Conventions

### Data Fetching Methods

When creating hooks that fetch data, use descriptive method names that clearly indicate what data is being fetched:

✅ **Good**:
```typescript
const { data, isLoading, error, fetchUsers } = useUsers();
const { metrics, isLoading, error, fetchMetrics } = useMetrics();
const { sites, isLoading, error, fetchSites } = useSites();
```

❌ **Avoid**:
```typescript
const { data, isLoading, error, refetch } = useUsers();
const { metrics, isLoading, error, refetch } = useMetrics();
const { sites, isLoading, error, refetch } = useSites();
```

Using descriptive method names like `fetchX` instead of generic names like `refetch` makes the code more readable and self-documenting. It also helps prevent confusion when multiple hooks are used in the same component.

### Hook Return Values

Hook return values should be named consistently across the application:

- `isLoading`: Boolean indicating if data is being loaded
- `error`: Error object or message if the operation failed
- `data`/`items`/`[resourceName]`: The actual data returned by the hook

## Hook Structure

### Dependency Injection

For better testability, hooks should accept dependencies as parameters:

```typescript
export function useUsers(options?: {
  initialFilter?: UserFilter;
  autoFetch?: boolean;
  fetchApi?: typeof fetchUsersApi;
}) {
  const { 
    initialFilter = {}, 
    autoFetch = true,
    fetchApi = fetchUsersApi
  } = options || {};
  
  // Hook implementation
}
```

This allows for easier mocking in tests.

### Error Handling

Hooks should handle errors gracefully and provide meaningful error messages:

```typescript
try {
  const data = await fetchApi(queryFilter);
  setData(data);
  return data;
} catch (err) {
  console.error('Error fetching data:', err);
  const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
  setError(errorMessage);
  return null;
}
```

### Auto-Fetching

Hooks that fetch data should have an `autoFetch` option that controls whether data is fetched automatically on mount:

```typescript
useEffect(() => {
  if (autoFetch) {
    fetchData();
  }
}, [autoFetch, fetchData]);
```

## Testing Hooks

### Mock Dependencies

When testing hooks, mock dependencies to isolate the hook from external services:

```typescript
const mockFetchApi = jest.fn();
const { result } = renderHook(() => 
  useUsers({ 
    autoFetch: false,
    fetchApi: mockFetchApi
  })
);
```

### Test Loading States

Test that loading states are properly managed:

```typescript
// Initial state
expect(result.current.isLoading).toBe(false);

// During fetch
act(() => {
  result.current.fetchUsers();
});
expect(result.current.isLoading).toBe(true);

// After fetch
await waitForNextUpdate();
expect(result.current.isLoading).toBe(false);
```

### Test Error Handling

Test that errors are properly handled:

```typescript
mockFetchApi.mockRejectedValueOnce(new Error('API error'));

act(() => {
  result.current.fetchUsers();
});

await waitForNextUpdate();

expect(result.current.error).toBe('API error');
```

## Migrating from Old Patterns

If you encounter hooks using the old `refetch` pattern, consider updating them to use more descriptive method names:

1. Rename the method to a more descriptive name (e.g., `fetchUsers`)
2. Update all components that use the hook
3. Update all tests that use the hook
4. If backward compatibility is needed, keep the old method as a deprecated alias

Example:
```typescript
// Old pattern
const refetch = async () => {
  await fetchData();
};

// New pattern
const fetchUsers = async () => {
  await fetchData();
};

// For backward compatibility
/**
 * @deprecated Use fetchUsers instead
 */
const refetch = fetchUsers;
```
