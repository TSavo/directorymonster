# Site Management Components

This directory contains components for managing sites in the DirectoryMonster admin interface.

## Component Structure

The site management system follows a modular architecture pattern:

```
src/components/admin/sites/
├── SiteForm.tsx                  # Multi-step form container
├── SiteSettings.tsx              # Site settings component
├── SEOSettings.tsx               # SEO configuration component
├── DomainManager.tsx             # Domain management component
├── index.ts                      # Main exports
├── components/                   # Form step components
│   ├── BasicInfoStep.tsx         # Basic site info form step
│   ├── DomainStep.tsx            # Domain management form step
│   ├── ThemeStep.tsx             # Theme selection form step
│   ├── SEOStep.tsx               # SEO settings form step
│   ├── SiteFormPreview.tsx       # Form preview component
│   ├── StepNavigation.tsx        # Step navigation controls
│   ├── FormActions.tsx           # Form action buttons
│   ├── preview/                  # Preview components
│   │   ├── BasicInfoPreview.tsx  # Basic info preview
│   │   ├── DomainsPreview.tsx    # Domains preview
│   │   ├── ThemePreview.tsx      # Theme preview
│   │   └── SEOPreview.tsx        # SEO preview
│   └── index.ts                  # Component exports
├── table/                        # Table components
│   ├── SiteTable.tsx             # Main table container
│   ├── SiteTableHeader.tsx       # Table header with search
│   ├── SiteTableSortHeader.tsx   # Sortable column headers
│   ├── SiteTableRow.tsx          # Individual site row
│   ├── SiteTablePagination.tsx   # Pagination controls
│   ├── SiteMobileCard.tsx        # Mobile view component
│   ├── DeleteConfirmationModal.tsx # Deletion confirmation
│   └── index.ts                  # Table exports
└── hooks/                        # Data hooks
    ├── index.ts                  # Hook exports
    ├── useDomains.ts             # Domain management hook
    └── useSites/                 # Site data management
        ├── index.ts              # Main hook export
        ├── types.ts              # Type definitions
        ├── validation.ts         # Form validation
        └── api.ts                # API integration
```

## Usage

### SiteForm

The SiteForm component is a multi-step form for creating and editing sites. It provides step navigation, validation, and preview functionality.

```jsx
import { SiteForm } from '@/components/admin/sites';

export default function CreateSitePage() {
  return (
    <SiteForm 
      mode="create"
      onSuccess={(data) => console.log('Site created:', data)}
    />
  );
}
```

### SiteTable

The SiteTable component displays a list of sites with sorting, filtering, and pagination.

```jsx
import { SiteTable } from '@/components/admin/sites';

export default function SitesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Site Management</h1>
      <SiteTable />
    </div>
  );
}
```

## Implementation Details

### Multi-Step Form Pattern

The SiteForm component uses a multi-step form pattern:

1. Each step is a separate component that handles a specific part of the form
2. Step navigation controls allow moving between steps
3. Each step is validated before proceeding to the next step
4. A preview step shows all information before submission
5. Form data is managed centrally through the useSites hook

### Responsive Design

The components are designed to be responsive:

- SiteTable uses a table view on desktop and cards on mobile
- SiteForm adjusts layouts for different screen sizes
- Navigation buttons are optimized for touch on mobile

### Accessibility

All components follow accessibility best practices:

- Proper ARIA attributes throughout
- Keyboard navigation support
- Focus management for modals
- Screen reader compatibility

### Data Management

The `useSites` hook provides comprehensive data management capabilities:

- Form state management with validation
- API integration for CRUD operations
- Filtering, sorting, and pagination
- Error handling and loading states

## Component API Reference

### SiteForm Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialData` | `object` | `{}` | Initial data for editing an existing site |
| `mode` | `'create'` or `'edit'` | `'create'` | Form mode |
| `onCancel` | `() => void` | - | Callback when form is canceled |
| `onSuccess` | `(data: any) => void` | - | Callback when form is submitted successfully |
| `apiEndpoint` | `string` | `'/api/sites'` | API endpoint for form submission |

### SiteTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/sites'` | API endpoint for fetching sites |

## Mobile Responsiveness

The site management components implement a responsive design strategy:

1. **Desktop View (md and above)**:
   - Full table layout with columns for all site data
   - Inline action buttons
   - Horizontal pagination controls

2. **Mobile View (sm and below)**:
   - Card-based layout with stacked information
   - Prominent action buttons
   - Simplified filtering and search
   - Optimized touch targets

## Form Step Validation

Each form step implements its own validation rules:

1. **Basic Info**:
   - Site name is required (max 50 chars)
   - Slug is required and must be URL-friendly
   - Description is optional (max 500 chars)

2. **Domains**:
   - At least one domain is required
   - Domains must follow valid format
   - No duplicate domains allowed

3. **Theme**:
   - Theme selection is required
   - Custom CSS validation for syntax

4. **SEO**:
   - Title and description length validation
   - Keywords format validation

## Error Handling

The components implement comprehensive error handling:

1. **Form Validation Errors**:
   - Inline error messages with ARIA attributes
   - Validation before proceeding to next step

2. **API Errors**:
   - User-friendly error messages
   - Retry functionality
   - Error boundaries for component failures

3. **Loading States**:
   - Skeleton loaders for initial data fetching
   - Disable controls during submission
   - Loading indicators on buttons

## Testing Approach

The site management components should be tested using the following approach:

1. **Unit Tests**:
   - Test each component in isolation
   - Mock hooks and API calls
   - Verify UI rendering and interactions

2. **Integration Tests**:
   - Test component interactions
   - Test form step navigation
   - Verify data flow between components

3. **Accessibility Tests**:
   - Test keyboard navigation
   - Verify ARIA attributes
   - Test screen reader compatibility

## Git Commit Instructions

When committing these changes, use:

```bash
git add .
git commit -m "feat(admin): implement site management components

- Add multi-step SiteForm with step navigation
- Create SiteTable with sorting and filtering
- Implement mobile-responsive views
- Add accessibility features
- Integrate with useSites hook for data management"
git push
```

## Future Improvements

Potential enhancements for future iterations:

1. **Advanced Filtering**:
   - Add filter by domain capability
   - Filter by creation date range
   - Save and apply filter presets

2. **Bulk Actions**:
   - Select multiple sites for batch operations
   - Bulk delete, enable/disable functionality

3. **Site Templates**:
   - Create new sites from templates
   - Save existing sites as templates

4. **Advanced Analytics**:
   - Add site performance metrics
   - Traffic and engagement visualization

5. **Role-Based Access Control**:
   - Granular permissions for site management
   - Role-specific views and capabilities