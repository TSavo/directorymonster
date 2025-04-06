# Listing Management Components

This directory contains components for managing listings in the DirectoryMonster admin interface.

## Component Structure

The listing management system follows a modular architecture pattern:

```
src/components/admin/listings/
├── ListingForm.tsx             # Multi-step form container
├── ListingTable.tsx            # Main table container
├── index.ts                    # Main exports
├── components/                 # Form and table components
│   ├── BasicInfoStep.tsx       # Basic listing info form step
│   ├── CategoryStep.tsx        # Category selection form step
│   ├── MediaStep.tsx           # Media upload form step
│   ├── PricingStep.tsx         # Pricing and options form step
│   ├── BacklinkStep.tsx        # Backlink management form step
│   ├── FormPreview.tsx         # Form preview component
│   ├── StepNavigation.tsx      # Step navigation controls
│   ├── FormActions.tsx         # Form action buttons
│   ├── ListingTableHeader.tsx  # Table header with search
│   ├── ListingTableSortHeader.tsx # Sortable column headers
│   ├── ListingTableRow.tsx     # Individual listing row
│   ├── ListingTablePagination.tsx # Pagination controls
│   ├── ListingFilterBar.tsx    # Advanced filtering tools
│   ├── CategoryFilterTree.tsx  # Category filtering component
│   ├── mobile/                 # Mobile-specific components
│   │   ├── ListingCardHeader.tsx  # Mobile card header
│   │   ├── ListingCardContent.tsx # Mobile card content
│   │   ├── ListingCardActions.tsx # Mobile action buttons
│   │   └── MobileFilterDrawer.tsx # Mobile filter UI
│   └── index.ts                # Component exports
├── hooks/                      # Data hooks
│   ├── index.ts                # Hook exports
│   ├── useListings.ts          # Listing data management hook
│   └── useListingForm.ts       # Form state management hook
└── types.ts                    # Type definitions
```

## Usage

### ListingForm

The ListingForm component is a multi-step form for creating and editing listings. It provides step navigation, validation, and preview functionality.

```jsx
import { ListingForm } from '@/components/admin/listings';

export default function CreateListingPage({ params }) {
  const { siteSlug } = params;

  return (
    <ListingForm
      siteSlug={siteSlug}
      mode="create"
      onSuccess={(data) => console.log('Listing created:', data)}
    />
  );
}
```

### ListingTable

The ListingTable component displays a list of listings with advanced filtering, sorting, and pagination.

```jsx
import { ListingTable } from '@/components/admin/listings';

export default function ListingsPage({ params }) {
  const { siteSlug } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Listing Management</h1>
      <ListingTable siteSlug={siteSlug} />
    </div>
  );
}
```

## Key Features

### Multi-Step Form

The ListingForm component uses a multi-step form pattern:

1. **Basic Info Step**:
   - Listing name, slug, and description
   - SEO metadata
   - Custom fields

2. **Category Step**:
   - Category selection with hierarchical tree view
   - Multiple category support
   - Primary category designation

3. **Media Step**:
   - Image upload and management
   - Featured image selection
   - Gallery ordering

4. **Pricing Step**:
   - Price and sale price inputs
   - Quantity and inventory management
   - Options and variants

5. **Backlink Step**:
   - Backlink URL configuration
   - Anchor text customization
   - Backlink verification

### Advanced Filtering

The ListingTable includes sophisticated filtering capabilities:

1. **Category Filtering**:
   - Hierarchical category tree filter
   - Multi-category selection
   - Category exclusion

2. **Status Filtering**:
   - Filter by publication status
   - Filter by featured status
   - Filter by verification status

3. **Date Filtering**:
   - Created date range
   - Updated date range
   - Published date range

4. **Text Search**:
   - Fulltext search across multiple fields
   - Fuzzy matching
   - Advanced query syntax

### Responsive Design

Both components are designed to be responsive:

- Table view on desktop, card view on mobile
- Optimized controls for touch interfaces
- Collapsible filters on small screens

## Component API Reference

### ListingForm Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteSlug` | `string` | Required | Slug of the site to create/edit listing for |
| `initialData` | `object` | `{}` | Initial data for editing an existing listing |
| `mode` | `'create'` or `'edit'` | `'create'` | Form mode |
| `onCancel` | `() => void` | - | Callback when form is canceled |
| `onSuccess` | `(data: any) => void` | - | Callback when form is submitted successfully |
| `apiEndpoint` | `string` | `/api/sites/${siteSlug}/listings` | API endpoint for form submission |

### ListingTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteSlug` | `string` | Required | Slug of the site to manage listings for |
| `apiEndpoint` | `string` | `/api/sites/${siteSlug}/listings` | API endpoint for fetching listings |
| `pageSize` | `number` | `10` | Default number of items per page |

## Data Structure

Listings follow this data structure:

The listing type is defined in `src/types/listing.ts` and includes the following key properties:

```typescript
interface Listing {
  id: string;
  siteId: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  status: ListingStatus | string;
  categoryIds: string[];
  categorySlug?: string;
  categories?: { id: string; name: string; slug: string; }[];
  media: ListingMedia[];
  price?: ListingPrice;
  contactInfo?: ContactInfo;
  seoData?: SEOData;
  backlinkInfo?: BacklinkInfo;
  customFields?: CustomField[] | Record<string, unknown>;
  featured?: boolean;
  featuredUntil?: string;
  viewCount?: number;
  clickCount?: number;
  submissionId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  userId: string;
  userDisplayName?: string;
}
```

See the full definition in `src/types/listing.ts` for all related types and enums.

## Error Handling

The listing management components implement comprehensive error handling:

1. **Form Validation Errors**:
   - Inline error messages with ARIA attributes
   - Step-specific validation
   - Prevent navigation to next step with invalid data

2. **API Errors**:
   - User-friendly error messages
   - Retry functionality
   - Error boundaries for component failures

3. **Loading States**:
   - Skeleton loaders for initial data fetching
   - Disable controls during submission
   - Loading indicators on buttons

## Testing Approach

The listing management components should be tested using the following approach:

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

## Future Improvements

Potential enhancements for future iterations:

1. **Bulk Operations**:
   - Select multiple listings for batch operations
   - Bulk editing of common fields
   - Bulk delete and archive capabilities

2. **Advanced Media Management**:
   - Media library integration
   - Video and document support
   - Media optimization

3. **Listing Templates**:
   - Save and apply listing templates
   - Template library management
   - Template import/export

4. **Version History**:
   - Track changes and revisions
   - Restore previous versions
   - Comparison view

5. **SEO Optimization Tools**:
   - SEO scoring and suggestions
   - Keyword density analysis
   - Automatic meta description generation