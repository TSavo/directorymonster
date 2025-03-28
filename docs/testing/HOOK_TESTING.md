# React Hook Testing Guide

This guide focuses on best practices for testing custom React hooks, based on our successful implementation of comprehensive tests for the `useCategories` hook in the DirectoryMonster project.

## Introduction to Hook Testing

Testing React hooks presents unique challenges since hooks cannot be used outside of React components. The React Testing Library provides a `renderHook` utility specifically designed for testing hooks, which renders the hook within a test component and gives access to the hook's return values.

## Hook Testing Fundamentals

### Rendering a Hook

The basic pattern for testing a hook is:

```typescript
import { renderHook } from '@testing-library/react';
import { useCustomHook } from '../hooks';

it('initializes with default values', () => {
  const { result } = renderHook(() => useCustomHook());
  
  expect(result.current.someValue).toBe(expectedValue);
});
```

### Testing State Updates

When testing state updates in hooks, you must wrap state-changing functions in `act()` to ensure state updates are processed before assertions:

```typescript
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCustomHook } from '../hooks';

it('updates state correctly', () => {
  const { result } = renderHook(() => useCustomHook());
  
  act(() => {
    result.current.someStateUpdateFunction('new value');
  });
  
  expect(result.current.someValue).toBe('new value');
});
```

### Testing Asynchronous Operations

For hooks that perform async operations (like API calls), use `async/await` with `waitForNextUpdate`:

```typescript
it('fetches data asynchronously', async () => {
  // Mock fetch
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(mockData)
  });
  
  const { result, waitForNextUpdate } = renderHook(() => useDataFetchingHook());
  
  // Initial state
  expect(result.current.isLoading).toBe(true);
  expect(result.current.data).toEqual([]);
  
  // Wait for async operation to complete
  await waitForNextUpdate();
  
  // Check state after update
  expect(result.current.isLoading).toBe(false);
  expect(result.current.data).toEqual(mockData);
  expect(result.current.error).toBeNull();
});
```

## Advanced Hook Testing Techniques

### Handling Multiple State Updates

When testing operations that cause multiple state updates, you might need multiple `waitForNextUpdate` calls or handle them in a single `act` block:

```typescript
it('handles multiple state updates', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useCustomHook());
  
  act(() => {
    result.current.triggerMultipleUpdates();
  });
  
  // Wait for all updates to complete
  await waitForNextUpdate();
  
  // For multiple sequential updates, you might need multiple waits
  // await waitForNextUpdate();
  
  expect(result.current.finalState).toBe(expectedValue);
});
```

### Testing Hooks with Props

For hooks that accept props, you can provide them in the renderHook call and update them with rerender:

```typescript
it('responds to prop changes', () => {
  const initialProps = { initialValue: 'initial' };
  const { result, rerender } = renderHook(
    (props) => useCustomHook(props.initialValue),
    { initialProps }
  );
  
  expect(result.current.value).toBe('initial');
  
  // Update props
  rerender({ initialValue: 'updated' });
  
  expect(result.current.value).toBe('updated');
});
```

### Testing Complex State Management

For hooks with complex state logic, break tests into smaller focused tests and use utility functions to make tests more readable:

```typescript
// Helper function to setup a specific state
const setupFilteredState = (searchTerm) => {
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    result.current.setSearchTerm(searchTerm);
  });
  
  return result;
};

it('filters items correctly', () => {
  const result = setupFilteredState('test');
  
  expect(result.current.filteredCategories.length).toBe(2);
  expect(result.current.filteredCategories[0].name).toContain('test');
});
```

## Testing the useCategories Hook - Specific Strategies

The `useCategories` hook includes multiple features that require different testing approaches. Here's how we structured the tests:

### 1. Base Initialization Tests

Test the hook initializes correctly with or without initial data:

```typescript
it('initializes with provided categories data', () => {
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  expect(result.current.categories).toEqual(mockCategories);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBeNull();
  
  // Verify default states for filtering, sorting, and pagination
  expect(result.current.searchTerm).toBe('');
  expect(result.current.sortField).toBe('order');
  expect(result.current.sortOrder).toBe('asc');
  expect(result.current.currentPage).toBe(1);
});
```

### 2. API Integration Tests

Test data fetching behavior:

```typescript
it('fetches categories from API when no initial data', async () => {
  // Mock fetch to return categories
  global.fetch = mockFetchSuccess(mockCategories);
  
  const { result, waitForNextUpdate } = renderHook(() => useCategories());
  
  // Initially in loading state
  expect(result.current.isLoading).toBe(true);
  
  // Wait for fetch to complete
  await waitForNextUpdate();
  
  // Verify fetch was called with correct endpoint
  expect(global.fetch).toHaveBeenCalledWith('/api/categories');
  
  // Verify state after fetch
  expect(result.current.isLoading).toBe(false);
  expect(result.current.categories).toEqual(mockCategories);
});
```

### 3. Filtering Tests

Test search and filter functionality:

```typescript
it('filters categories by search term', () => {
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    result.current.setSearchTerm('subcategory');
  });
  
  // Verify filtered results
  expect(result.current.filteredCategories.length).toBe(1);
  expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
  
  // Clear filter
  act(() => {
    result.current.setSearchTerm('');
  });
  
  // All categories should be shown again
  expect(result.current.filteredCategories.length).toBe(mockCategories.length);
});
```

### 4. Sorting Tests

Test sorting functionality:

```typescript
it('sorts categories by different fields', () => {
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  // Sort by name ascending
  act(() => {
    result.current.handleSort('name');
  });
  
  expect(result.current.sortField).toBe('name');
  expect(result.current.sortOrder).toBe('asc');
  
  // Verify categories are sorted by name
  const sortedNames = result.current.filteredCategories.map(c => c.name);
  expect(sortedNames).toEqual([...sortedNames].sort());
  
  // Toggle sort direction
  act(() => {
    result.current.handleSort('name');
  });
  
  expect(result.current.sortOrder).toBe('desc');
  
  // Verify categories are sorted in reverse
  const reverseSortedNames = result.current.filteredCategories.map(c => c.name);
  expect(reverseSortedNames).toEqual([...reverseSortedNames].sort().reverse());
});
```

### 5. Pagination Tests

Test pagination functionality:

```typescript
it('paginates categories correctly', () => {
  // Create enough categories to paginate
  const paginatedCategories = Array.from({ length: 25 }, (_, i) => ({
    ...mockCategories[0],
    id: `category_${i + 1}`,
    name: `Category ${i + 1}`
  }));
  
  const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
  
  // Default 10 items per page
  expect(result.current.itemsPerPage).toBe(10);
  expect(result.current.totalPages).toBe(3);
  expect(result.current.currentCategories.length).toBe(10);
  
  // Navigate to page 2
  act(() => {
    result.current.goToPage(2);
  });
  
  expect(result.current.currentPage).toBe(2);
  expect(result.current.currentCategories.length).toBe(10);
  expect(result.current.currentCategories[0].id).toBe('category_11');
  
  // Change items per page
  act(() => {
    result.current.setItemsPerPage(5);
  });
  
  expect(result.current.itemsPerPage).toBe(5);
  expect(result.current.totalPages).toBe(5);
  // Should reset to page 1
  expect(result.current.currentPage).toBe(1);
});
```

### 6. Delete Functionality Tests

Test the delete confirmation workflow:

```typescript
it('manages delete confirmation state', () => {
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  // Confirm delete
  act(() => {
    result.current.confirmDelete('category_1', 'Test Category 1');
  });
  
  // Check modal is open with correct category
  expect(result.current.isDeleteModalOpen).toBe(true);
  expect(result.current.categoryToDelete).toEqual({
    id: 'category_1',
    name: 'Test Category 1'
  });
  
  // Cancel delete
  act(() => {
    result.current.cancelDelete();
  });
  
  // Check modal is closed
  expect(result.current.isDeleteModalOpen).toBe(false);
  expect(result.current.categoryToDelete).toBeNull();
});

it('handles delete operation', async () => {
  // Mock fetch for DELETE
  global.fetch = jest.fn().mockImplementation((url, options) => {
    if (options?.method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCategories)
    });
  });
  
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  // Setup delete
  act(() => {
    result.current.confirmDelete('category_1', 'Test Category 1');
  });
  
  // Execute delete
  await act(async () => {
    await result.current.handleDelete('category_1');
  });
  
  // Verify API call
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/categories/category_1',
    expect.objectContaining({ method: 'DELETE' })
  );
  
  // Verify state updates
  expect(result.current.isDeleteModalOpen).toBe(false);
  expect(result.current.categories.length).toBe(mockCategories.length - 1);
  expect(result.current.categories.find(c => c.id === 'category_1')).toBeUndefined();
});
```

## Testing Hook Edge Cases

### Testing Error Handling

Verify hooks handle errors properly:

```typescript
it('handles API fetch errors', async () => {
  // Mock fetch to return error
  global.fetch = jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok: false,
      statusText: 'Not Found',
      json: () => Promise.reject(new Error('Not Found'))
    })
  );
  
  const { result, waitForNextUpdate } = renderHook(() => useCategories());
  
  // Wait for fetch to complete
  await waitForNextUpdate();
  
  // Verify error state
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBe('Not Found');
  expect(result.current.categories).toEqual([]);
});
```

### Testing Multiple Hook Instances

When testing complex state management that involves multiple state updates, it's sometimes cleaner to use separate hook instances:

```typescript
it('sets pagination state correctly', () => {
  // First instance - test items per page
  const { result: result1 } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    result1.current.setItemsPerPage(5);
  });
  
  expect(result1.current.itemsPerPage).toBe(5);
  
  // Second instance - test page navigation
  const { result: result2 } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    result2.current.goToPage(2);
  });
  
  expect(result2.current.currentPage).toBe(2);
});
```

## Common Pitfalls and Solutions

### 1. Act Warning

Most common warning: `Warning: An update to Component inside a test was not wrapped in act(...)`

Solutions:
- Always wrap state updates in `act()`
- Use `waitForNextUpdate` for async operations
- For complex updates, use `async/await` with `act`

```typescript
// Correct approach for async operations
await act(async () => {
  await result.current.asyncFunction();
});
```

### 2. Multiple State Updates

For hooks that update multiple pieces of state in response to a single action:

```typescript
// Wait for all state updates to complete
await act(async () => {
  result.current.functionThatUpdatesMultipleStates();
  await new Promise(resolve => setTimeout(resolve, 0));
});
```

### 3. Test Isolation

Ensure tests are isolated to prevent interference:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any global mocks
  global.fetch = originalFetch;
});

afterEach(() => {
  // Cleanup any mock state
  jest.restoreAllMocks();
});
```

### 4. Testing Hooks That Use Context

For hooks that depend on React Context:

```typescript
const wrapper = ({ children }) => (
  <ContextProvider value={contextValue}>
    {children}
  </ContextProvider>
);

const { result } = renderHook(() => useHookThatUsesContext(), { wrapper });
```

## Best Practices for Writing Hook Tests

1. **Create focused test files for different features**
   - `useCategories.init.test.ts` - Initialization
   - `useCategories.filtering.test.ts` - Filtering
   - `useCategories.sorting.test.ts` - Sorting
   - And so on for each major feature area

2. **Create helper functions for test setup**
   - Create mock data utilities
   - Create helper functions for common test patterns
   - Mock external dependencies consistently

3. **Test each state update function independently**
   - Test one state-updating function at a time
   - Verify both the function call and resulting state change

4. **Test derived state and calculations**
   - Test that calculated values (like filtered/sorted lists) are correct
   - Test that derived state updates when dependencies change

5. **Test API interactions thoroughly**
   - Mock API calls and verify correct endpoints and parameters
   - Test both success and error cases
   - Verify state is updated correctly after API calls

6. **Test complex interactions and edge cases**
   - Test combined filtering, sorting, and pagination
   - Test boundary conditions (empty arrays, first/last page, etc.)
   - Test error recovery and retry mechanisms

## Additional Resources

- [React Testing Library - renderHook](https://testing-library.com/docs/react-testing-library/api/#renderhook)
- [React Testing Library - act](https://reactjs.org/docs/test-utils.html#act)
- [Testing React Hooks by Kent C. Dodds](https://kentcdodds.com/blog/how-to-test-custom-react-hooks)
- [Common Testing Library Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
