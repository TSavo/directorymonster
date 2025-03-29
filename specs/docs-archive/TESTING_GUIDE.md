# DirectoryMonster Testing Guide

## Overview

This guide documents the testing patterns and best practices used in the DirectoryMonster project. The examples and approaches outlined here have been successfully applied to the Category Management components, achieving 100% test coverage with robust, maintainable tests.

## Test Organization

We follow a modular approach to organizing tests, breaking them down by functionality rather than having single large test files.

### Component Tests

For complex components, we organize tests into multiple specialized files:

```
tests/
  └── admin/
      └── categories/
          ├── CategoryTable.basic.test.tsx      # Core rendering and structure
          ├── CategoryTable.hierarchy.test.tsx  # Hierarchical view functionality
          ├── CategoryTable.filtering.test.tsx  # Search and filtering
          ├── CategoryTable.accessibility.test.tsx # Accessibility and keyboard navigation
          ├── CategoryTable.pagination.test.tsx # Pagination and deletion functionality
          └── components/
              ├── CategoriesMobileView.test.tsx # Basic functionality
              ├── CategoriesMobileView.accessibility.test.tsx # Accessibility
              ├── CategoriesMobileView.edgecases.test.tsx # Edge cases and error handling
              ├── CategoriesMobileView.interaction.test.tsx # User interactions
              ├── CategoriesMobileView.keyboard.test.tsx # Keyboard navigation
              └── CategoriesMobileView.url.test.tsx # URL construction
```

### Hook Tests

For complex hooks, we follow a similar pattern, creating specialized test files for different functionality:

```
tests/
  └── admin/
      └── categories/
          └── hooks/
              ├── useCategoriesTestHelpers.ts        # Shared test helpers
              ├── useCategories.init.test.ts         # Initialization and state management
              ├── useCategories.filtering.test.ts    # Search and filtering
              ├── useCategories.sorting.test.ts      # Sorting functionality
              ├── useCategories.pagination.test.ts   # Pagination functionality
              ├── useCategories.deletion.test.ts     # Delete confirmation workflow
              └── useCategories.api.test.ts          # API integration
```

## Test Helpers

Create reusable helpers to simplify test setup and reduce duplication:

### Component Test Helpers

```typescript
// Example from categoryTableTestHelpers.tsx
export const mockCategories: CategoryWithRelations[] = [
  // Mock data...
];

export const setupCategoryTableTest = (overrides = {}) => {
  const mockHook = createMockCategoriesHook(overrides);
  (hooks.useCategories as jest.Mock).mockReturnValue(mockHook);
  return mockHook;
};

export const resetMocks = () => {
  jest.clearAllMocks();
};
```

### Hook Test Helpers

```typescript
// Example from useCategoriesTestHelpers.ts
export const mockFetchSuccess = (responseData: any) => {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData),
    })
  );
};

export const createPaginatedCategories = (count: number): CategoryWithRelations[] => {
  // Create mock data for pagination tests...
};
```

## Test Best Practices

### 1. Element Selection

Use data-testid attributes for reliable element selection:

```tsx
// In component:
<div data-testid="categories-mobile-view">
  {categories.map(category => (
    <article data-testid={`category-card-${category.id}`}>
      <h3 data-testid={`category-name-${category.id}`}>{category.name}</h3>
    </article>
  ))}
</div>

// In test:
const container = screen.getByTestId('categories-mobile-view');
expect(container).toBeInTheDocument();
expect(screen.getByTestId(`category-name-${category.id}`)).toHaveTextContent(category.name);
```

### 2. Testing Behavior, Not Implementation

Focus on what the component does, not how it's built:

```typescript
// Good: Test what the user sees
it('displays error message when API request fails', async () => {
  setupCategoryTableTest({ error: 'Failed to fetch categories' });
  render(<CategoryTable />);
  
  expect(screen.getByTestId('error-title')).toHaveTextContent('Error Loading Categories');
  expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch categories');
});

// Bad: Testing implementation details
it('sets error state when API fails', async () => {
  // Don't test component's internal state directly
  const { result } = renderHook(() => useState(null));
  expect(result.current[0]).toBeNull();
});
```

### 3. Comprehensive Testing of Component States

Test all possible states a component can have:

1. **Loading state**
2. **Error state**
3. **Empty state**
4. **Nominal state**
5. **Alternative views** (e.g., hierarchy view, mobile view)

```typescript
it('renders the loading state when isLoading is true', () => {
  setupCategoryTableTest({ isLoading: true });
  render(<CategoryTable />);
  expect(screen.getByTestId('loading-status')).toBeInTheDocument();
});

it('renders the error state when error is present', () => {
  setupCategoryTableTest({ error: 'Failed to fetch' });
  render(<CategoryTable />);
  expect(screen.getByTestId('error-message')).toBeInTheDocument();
});

it('renders the empty state when no data is available', () => {
  setupCategoryTableTest({ categories: [] });
  render(<CategoryTable />);
  expect(screen.getByTestId('empty-state-container')).toBeInTheDocument();
});
```

### 4. Accessibility Testing

Test for proper ARIA attributes and keyboard navigation:

```typescript
it('provides proper ARIA roles for table structure', () => {
  render(<CategoryTable />);
  
  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();
  
  const columnHeaders = screen.getAllByRole('columnheader');
  expect(columnHeaders.length).toBeGreaterThanOrEqual(4);
});

it('supports keyboard navigation for interactive elements', async () => {
  const user = userEvent.setup();
  render(<CategoryTable />);
  
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('search-input'));
  
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('clear-search-button'));
});
```

### 5. Event Handling Tests

Test that events trigger the correct actions:

```typescript
it('calls setSearchTerm when search input is used', async () => {
  const user = userEvent.setup();
  const mockSetSearchTerm = jest.fn();
  
  setupCategoryTableTest({ setSearchTerm: mockSetSearchTerm });
  render(<CategoryTable />);
  
  const searchInput = screen.getByTestId('search-input');
  await user.type(searchInput, 'test');
  
  expect(mockSetSearchTerm).toHaveBeenCalledWith('test');
});
```

### 6. Mocking Dependencies

Mock external dependencies to isolate component testing:

```typescript
// Mock hooks
jest.mock('../../../../src/components/admin/categories/hooks', () => ({
  useCategories: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => (
    <a href={href}>{children}</a>
  );
});

// Setup hook mock before tests
const mockHook = {
  categories: mockCategories,
  isLoading: false,
  // ...other properties
};
useCategories.mockReturnValue(mockHook);
```

## Testing React Hooks

### 1. Setup and Rendering

Use React Testing Library's `renderHook` for hook testing:

```typescript
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCategories } from '../hooks';

it('initializes with default values', () => {
  const { result } = renderHook(() => useCategories());
  
  expect(result.current.categories).toEqual([]);
  expect(result.current.isLoading).toBe(true);
});
```

### 2. Testing State Updates

Use `act` to handle state updates:

```typescript
it('updates search term state', () => {
  const { result } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    result.current.setSearchTerm('test');
  });
  
  expect(result.current.searchTerm).toBe('test');
  expect(result.current.filteredCategories.length).toBe(2); // Assuming 2 matches
});
```

### 3. Testing Asynchronous Operations

Use async/await with act for async operations:

```typescript
it('fetches data on mount', async () => {
  global.fetch = mockFetchSuccess(mockCategories);
  
  const { result, waitForNextUpdate } = renderHook(() => useCategories());
  
  // Initially loading
  expect(result.current.isLoading).toBe(true);
  
  // Wait for fetch to complete
  await waitForNextUpdate();
  
  // Loading complete
  expect(result.current.isLoading).toBe(false);
  expect(result.current.categories).toEqual(mockCategories);
});
```

### 4. Testing Complex State Transitions

Create separate hook renders for complex multi-step operations:

```typescript
it('handles pagination state changes', () => {
  // For setting items per page
  const { result: resultA } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    resultA.current.setItemsPerPage(5);
  });
  
  expect(resultA.current.itemsPerPage).toBe(5);
  
  // For changing pages - separate instance to avoid React state update errors
  const { result: resultB } = renderHook(() => useCategories(undefined, mockCategories));
  
  act(() => {
    resultB.current.goToPage(2);
  });
  
  expect(resultB.current.currentPage).toBe(2);
});
```

## Common Testing Scenarios

### Testing Conditional Rendering

```typescript
it('conditionally shows site column based on mode', () => {
  // Multi-site mode
  setupCategoryTableTest({ sites: mockSites });
  render(<CategoryTable />);
  expect(screen.getByText('Site')).toBeInTheDocument();
  
  // Single-site mode
  setupCategoryTableTest({ sites: [] });
  render(<CategoryTable siteSlug="test-site" />);
  expect(screen.queryByText('Site')).not.toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
it('calls confirmDelete when delete button is clicked', async () => {
  const user = userEvent.setup();
  const mockConfirmDelete = jest.fn();
  
  setupCategoryTableTest({ confirmDelete: mockConfirmDelete });
  render(<CategoryTable />);
  
  const deleteButton = screen.getByTestId('delete-button-category_1');
  await user.click(deleteButton);
  
  expect(mockConfirmDelete).toHaveBeenCalledWith('category_1', 'Test Category 1');
});
```

### Testing Modals and Dialogs

```typescript
it('displays delete confirmation modal with correct content', () => {
  setupCategoryTableTest({
    isDeleteModalOpen: true,
    categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
  });
  
  render(<CategoryTable />);
  
  const modal = screen.getByTestId('delete-modal');
  expect(modal).toBeInTheDocument();
  expect(modal).toHaveAttribute('role', 'dialog');
  expect(screen.getByText('Delete Category')).toBeInTheDocument();
  expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  expect(screen.getByText('"Test Category 1"')).toBeInTheDocument();
});
```

## Edge Case Testing

Always test edge cases to ensure robust components:

1. **Empty arrays and collections**
2. **Null or undefined values**
3. **Special characters in text fields**
4. **Very long text content**
5. **Extreme numerical values**
6. **Boundary conditions (first/last page, etc.)**

```typescript
it('handles empty categories array gracefully', () => {
  setupCategoryTableTest({ categories: [] });
  render(<CategoryTable />);
  expect(screen.getByTestId('empty-state-container')).toBeInTheDocument();
});

it('handles special characters in category names', () => {
  const specialCharsCategory = {
    ...mockCategories[0],
    name: '<script>alert("XSS")</script> & " \' < > &amp;'
  };
  
  setupCategoryTableTest({ categories: [specialCharsCategory] });
  render(<CategoryTable />);
  
  // Should display name with special chars (safely escaped by React)
  expect(screen.getByTestId(`category-name-${specialCharsCategory.id}`))
    .toHaveTextContent('<script>alert("XSS")</script> & " \' < > &amp;');
  
  // No actual script execution should occur
  expect(document.querySelector('script')).not.toBeInTheDocument();
});
```

## Performance Considerations

### Optimize Test Speed

1. Use **small, focused tests** rather than large, comprehensive ones
2. Mock external dependencies to avoid network calls
3. Use **beforeEach/afterEach** to reset the state between tests
4. Consider using **test.each** for data-driven tests

### Maintainable Tests

1. **Don't couple tests to implementation details** - they should still pass even if the component implementation changes
2. Use **data-testid** attributes for stable selectors
3. **Group related tests** in describe blocks
4. Use **descriptive test names** that explain the expected behavior

## Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
