# Category Management Components

This directory contains components for managing categories in the DirectoryMonster admin interface.

## Component Structure

The category management system follows a modular architecture pattern:

```
src/components/admin/categories/
├── CategoryTable.tsx            # Main container component
├── hooks/
│   ├── index.ts                # Hook exports
│   └── useCategories.ts        # Data management hook
├── types.ts                    # Type definitions
└── components/
    ├── CategoryTableRow.tsx    # Individual category display
    ├── CategoryTableHeader.tsx # Search and filtering
    ├── CategoryTableSortHeader.tsx # Column sorting
    ├── CategoryTablePagination.tsx # Results navigation
    ├── CategoryTableError.tsx  # Error handling
    ├── CategoryTableSkeleton.tsx # Loading state
    ├── CategoryTableEmptyState.tsx # No results guidance
    ├── CategoriesMobileView.tsx # Mobile optimization
    └── DeleteConfirmationModal.tsx # Safe deletion
```

## Usage

### CategoryTable

The CategoryTable component displays a list of categories with hierarchical relationships, sorting, filtering, and pagination.

```jsx
import CategoryTable from '@/components/admin/categories/CategoryTable';

export default function AdminCategoriesPage({ params }) {
  const { siteSlug } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>
      <CategoryTable siteSlug={siteSlug} />
    </div>
  );
}
```

## Key Features

1. **Hierarchical Relationships**
   - Parent-child category relationships
   - Visual tree structure with indentation
   - Filtering by parent category
   - Child count indicators

2. **Responsive Design**
   - Table view for desktop users
   - Card-based view for mobile users
   - Adaptive layout for different screen sizes

3. **Data Management**
   - Comprehensive `useCategories` hook
   - Sorting by various fields (name, order, creation date)
   - Search with multiple filters
   - Pagination with customizable page size

4. **Accessibility**
   - Proper ARIA attributes throughout
   - Keyboard navigation support
   - Focus management for modal dialogs
   - Screen reader compatibility

5. **Error Handling**
   - Loading states with skeleton UI
   - Error display with retry functionality
   - Empty state guidance

## Component API Reference

### CategoryTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteSlug` | `string` | Required | Slug of the site to manage categories for |
| `apiEndpoint` | `string` | `/api/sites/${siteSlug}/categories` | API endpoint for category data |
| `pageSize` | `number` | `10` | Default number of items per page |

### Data Structure

Categories follow this data structure:

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  order: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

The category management components implement comprehensive error handling:

1. **Form Validation Errors**:
   - Inline error messages with ARIA attributes
   - Prevent submission with invalid data

2. **API Errors**:
   - User-friendly error messages
   - Retry functionality
   - Error boundaries for component failures

3. **Loading States**:
   - Skeleton loaders for initial data fetching
   - Disable controls during submission
   - Loading indicators on buttons

## Testing Approach

The category management components should be tested using the following approach:

1. **Unit Tests**:
   - Test each component in isolation
   - Mock hooks and API calls
   - Verify UI rendering and interactions

2. **Integration Tests**:
   - Test component interactions
   - Test tree structure and hierarchical display
   - Verify data flow between components

3. **Accessibility Tests**:
   - Test keyboard navigation
   - Verify ARIA attributes
   - Test screen reader compatibility

## Future Improvements

Potential enhancements for future iterations:

1. **Drag and Drop Reordering**:
   - Intuitive drag and drop interface for reordering
   - Batch reordering capabilities

2. **Advanced Hierarchy Management**:
   - Visual tree view for hierarchy management
   - Multi-level operations (move branch, etc.)

3. **Import/Export**:
   - Bulk import categories from CSV/JSON
   - Export category structure to various formats

4. **Category Properties**:
   - Custom fields and properties
   - Category-specific validation rules

5. **Category Preview**:
   - Preview category appearance on the frontend
   - Visual category builder