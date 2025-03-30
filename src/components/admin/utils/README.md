# Admin Utility Components

This directory contains utility components and functions used across the DirectoryMonster admin interface.

## Component Structure

The utilities follow a modular organization pattern:

```
src/components/admin/utils/
├── index.ts                    # Main exports
├── components/                 # Utility components
│   ├── Breadcrumbs.tsx         # Breadcrumb navigation
│   ├── Pagination.tsx          # Reusable pagination
│   ├── SearchBar.tsx           # Reusable search input
│   ├── SortableHeader.tsx      # Sortable table header
│   ├── ConfirmDialog.tsx       # Confirmation dialog
│   ├── EmptyState.tsx          # Empty state component
│   ├── ErrorBoundary.tsx       # Error boundary component
│   ├── ErrorDisplay.tsx        # Error message display
│   ├── LoadingIndicator.tsx    # Loading state components
│   ├── LoadingSkeleton.tsx     # Skeleton loaders
│   ├── FileUploader.tsx        # File upload component
│   ├── ImageCropper.tsx        # Image cropping utility
│   ├── RichTextEditor.tsx      # Rich text editor
│   ├── ColorPicker.tsx         # Color selection tool
│   ├── DateRangePicker.tsx     # Date range selection
│   ├── Tooltips.tsx            # Tooltip components
│   └── index.ts                # Component exports
├── hooks/                      # Utility hooks
│   ├── index.ts                # Hook exports
│   ├── useDebounce.ts          # Debounce hook
│   ├── useMediaQuery.ts        # Responsive design hook
│   ├── usePagination.ts        # Pagination state hook
│   ├── useSorting.ts           # Table sorting hook
│   ├── useLocalStorage.ts      # Local storage hook
│   ├── useClickOutside.ts      # Click outside detection
│   └── useIntersectionObserver.ts # Intersection observer
├── functions/                  # Utility functions
│   ├── index.ts                # Function exports
│   ├── formatters.ts           # Data formatting utilities
│   ├── validators.ts           # Form validation functions
│   ├── filters.ts              # Data filtering utilities
│   ├── sorters.ts              # Data sorting functions
│   └── transformers.ts         # Data transformation helpers
└── types.ts                    # Common type definitions
```

## Usage

### Components

Utility components are designed to be used across the admin interface for consistent UI patterns.

```jsx
import { 
  Breadcrumbs, 
  SearchBar, 
  Pagination 
} from '@/components/admin/utils/components';

export default function ExamplePage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Current Page' }
        ]}
      />
      
      <SearchBar
        placeholder="Search..."
        onChange={handleSearch}
        value={searchTerm}
      />
      
      {/* Page content */}
      
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

### Hooks

Utility hooks provide reusable logic across components.

```jsx
import { 
  useDebounce, 
  usePagination, 
  useSorting 
} from '@/components/admin/utils/hooks';

function ExampleComponent() {
  // Debounced search input
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Pagination state management
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    paginatedData,
    totalPages
  } = usePagination({
    data: items,
    initialPage: 1,
    initialPageSize: 10
  });
  
  // Sorting logic
  const {
    sortBy,
    sortOrder,
    sortedData,
    handleSort
  } = useSorting({
    data: paginatedData,
    initialSortBy: 'name',
    initialSortOrder: 'asc'
  });
  
  // ...component logic
}
```

### Utility Functions

Helper functions provide common operations for data manipulation.

```jsx
import { 
  formatDate, 
  formatCurrency, 
  slugify 
} from '@/components/admin/utils/functions/formatters';

import {
  validateEmail,
  validatePassword,
  validateUrl
} from '@/components/admin/utils/functions/validators';

// Format a date
const formattedDate = formatDate(new Date(), 'YYYY-MM-DD');

// Format currency
const price = formatCurrency(19.99, 'USD');

// Create a slug
const slug = slugify('This is a title');

// Validate form inputs
const isEmailValid = validateEmail(email);
const isPasswordValid = validatePassword(password);
const isUrlValid = validateUrl(website);
```

## Key Components

### Breadcrumbs

Navigation component showing the current location in the admin hierarchy.

```jsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Edit Category' }
  ]}
  separator="/"
  className="mb-4"
/>
```

### ConfirmDialog

Modal dialog for confirming user actions.

```jsx
<ConfirmDialog
  isOpen={isDeleteDialogOpen}
  title="Delete Item"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDeleteConfirm}
  onCancel={() => setIsDeleteDialogOpen(false)}
  isDangerous={true}
/>
```

### ErrorBoundary

React error boundary for catching and displaying errors.

```jsx
<ErrorBoundary
  fallback={<ErrorDisplay message="Something went wrong" />}
>
  <ComponentThatMightError />
</ErrorBoundary>
```

### FileUploader

Component for file uploads with drag-and-drop support.

```jsx
<FileUploader
  accept=".jpg,.jpeg,.png,.gif"
  maxSize={5 * 1024 * 1024} // 5MB
  multiple={true}
  onUpload={handleFileUpload}
  onError={handleFileError}
/>
```

## Hooks API Reference

### useDebounce

Debounces a value to prevent excessive re-renders or API calls.

```typescript
function useDebounce<T>(value: T, delay: number): T;
```

### usePagination

Manages pagination state and logic.

```typescript
function usePagination<T>({
  data,
  initialPage,
  initialPageSize
}: {
  data: T[];
  initialPage: number;
  initialPageSize: number;
}): {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  paginatedData: T[];
  totalPages: number;
  totalItems: number;
};
```

### useSorting

Manages sorting state and logic for tables.

```typescript
function useSorting<T>({
  data,
  initialSortBy,
  initialSortOrder
}: {
  data: T[];
  initialSortBy: keyof T;
  initialSortOrder: 'asc' | 'desc';
}): {
  sortBy: keyof T;
  sortOrder: 'asc' | 'desc';
  sortedData: T[];
  handleSort: (field: keyof T) => void;
};
```

## Styling Patterns

All utility components follow consistent styling patterns:

1. **Tailwind CSS**:
   - Tailwind utility classes for styling
   - Consistent color scheme with design system
   - Responsive behavior with Tailwind breakpoints

2. **Composition**:
   - Favor composition over inheritance
   - Small, focused components
   - Props for customization and flexibility

3. **Accessibility**:
   - ARIA attributes where appropriate
   - Keyboard navigation support
   - Focus management
   - Screen reader compatibility

## Best Practices

When using or extending these utilities:

1. **Keep Components Small and Focused**:
   - Each component should have a single responsibility
   - Compose complex UIs from simple components

2. **Consistent Props API**:
   - Follow consistent naming conventions
   - Use standard event handler patterns
   - Include appropriate TypeScript types

3. **Accessibility First**:
   - Always consider keyboard navigation
   - Include appropriate ARIA attributes
   - Test with screen readers

4. **Performance Considerations**:
   - Use memoization for expensive computations
   - Apply debouncing for frequent events
   - Consider lazy loading for heavy components

5. **Error Handling**:
   - Wrap components in ErrorBoundary when appropriate
   - Provide fallback UI for error states
   - Include helpful error messages

## Testing Approach

Utility components should have comprehensive tests:

1. **Unit Tests**:
   - Test each component in isolation
   - Test with various prop combinations
   - Test edge cases and error handling

2. **Hook Tests**:
   - Test hook behavior and state changes
   - Verify custom logic
   - Test with various input scenarios

3. **Function Tests**:
   - Test utility functions with various inputs
   - Verify expected outputs
   - Test edge cases and error handling

4. **Accessibility Tests**:
   - Test keyboard navigation
   - Test ARIA attributes
   - Test screen reader compatibility