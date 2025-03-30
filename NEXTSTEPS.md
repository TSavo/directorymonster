# DirectoryMonster Implementation Next Steps - [2025-03-29] - Listing Form Components Implemented

## Recently Completed
- ✅ Implemented comprehensive Category Management functionality
- ✅ Implemented modular Listing Form components with multi-step navigation
- ✅ Created form validation and state management utilities
- ✅ Implemented rich media upload functionality
- ✅ Developed hierarchical category selection

## Priority Tasks (Next Sprint)

### Listing Management Implementation - Break into Micro Components
- [x] Create ListingForm Directory Structure
  - [x] `components/admin/listings/components/form/`
    - [x] `BasicInfoStep.tsx` - First step with basic listing info
    - [x] `CategorySelectionStep.tsx` - Category selection component
    - [x] `MediaUploadStep.tsx` - Image upload functionality
    - [x] `PricingStep.tsx` - Pricing and availability information
    - [x] `BacklinkStep.tsx` - Backlink configuration
    - [x] `listingFormValidation.ts` - Separate validation logic
    - [x] `useListingForm.ts` - Form state management hook
    - [x] `FormProgress.tsx` - Multi-step indicator
    - [x] `StepControls.tsx` - Next/back navigation
    - [ ] `FormPreview.tsx` - Preview component
  - [x] `components/admin/listings/ListingFormModal.tsx` - Modal wrapper

- [x] Create ListingTable Components
  - [x] `components/admin/listings/components/table/`
    - [x] `ListingTableHeader.tsx` - Filter and search
    - [x] `ListingTableColumns.tsx` - Column definitions
    - [x] `ListingTableRow.tsx` - Individual listing row
    - [x] `ListingTableCell.tsx` - Cell component with formatting
    - [x] `ListingTableActions.tsx` - Action buttons
    - [x] `useListingTable.ts` - Table state hook
    - [x] `ListingTableContainer.tsx` - Table wrapper
    - [x] `ListingTableSkeleton.tsx` - Loading state
    - [ ] `ListingFilterBar.tsx` - Advanced filtering
    - [ ] `CategoryFilterTree.tsx` - Hierarchical category filter

- [ ] Enhance Listing Mobile View Components
  - [x] `components/admin/listings/components/mobile/`
    - [x] `ListingCard.tsx` - Card representation of listing
    - [ ] `ListingCardHeader.tsx` - Card header with status
    - [ ] `ListingCardContent.tsx` - Main content
    - [ ] `ListingCardActions.tsx` - Mobile action buttons
    - [ ] `ListingCardMedia.tsx` - Image display component
    - [ ] `MobileFilterDrawer.tsx` - Mobile filter interface

### Site Management Implementation - Break into Micro Components
- [ ] Create SiteForm Directory Structure
  - [ ] `components/admin/sites/components/form/`
    - [ ] `BasicInfoSection.tsx` - Name, description, etc.
    - [ ] `DomainSection.tsx` - Domain configuration
    - [ ] `ThemeSection.tsx` - Visual customization
    - [ ] `SEOSection.tsx` - Meta settings and SEO
    - [ ] `AnalyticsSection.tsx` - Analytics integration
    - [ ] `SiteFormTabs.tsx` - Tab navigation
    - [ ] `useSiteForm.ts` - Form state management
    - [ ] `SiteFormActions.tsx` - Save/cancel buttons
    - [ ] `SiteFormValidation.ts` - Validation logic
    - [ ] `DomainVerification.tsx` - Domain verification UI
    
- [ ] Create SiteTable Components
  - [ ] `components/admin/sites/components/table/`
    - [ ] `SiteTableHeader.tsx` - Header with actions
    - [ ] `SiteTableColumns.tsx` - Column definitions
    - [ ] `SiteTableRow.tsx` - Site row component
    - [ ] `SiteStatusIndicator.tsx` - Visual status display
    - [ ] `SiteMetricsPreview.tsx` - Quick metrics display
    - [ ] `SiteTableActions.tsx` - Action buttons
    - [ ] `SiteTableContainer.tsx` - Table wrapper
    - [ ] `SiteTablePagination.tsx` - Pagination controls
    - [ ] `useSiteTable.ts` - Table state hook
    - [ ] `SiteFilterSection.tsx` - Filtering options

- [ ] Create Site Mobile View Components
  - [ ] `components/admin/sites/components/mobile/`
    - [ ] `SiteCard.tsx` - Mobile site card
    - [ ] `SiteCardHeader.tsx` - Card header
    - [ ] `SiteCardStatus.tsx` - Status display for mobile
    - [ ] `SiteCardActions.tsx` - Mobile actions
    - [ ] `SiteCardMetrics.tsx` - Key metrics display
    - [ ] `MobileSiteFilters.tsx` - Mobile filtering

### Component Types and Utilities
- [ ] Create comprehensive type definitions
  - [ ] `types/listings.ts` - Listing-related types
  - [ ] `types/sites.ts` - Site-related types
  - [ ] `types/categories.ts` - Category-related types (already created)
  - [ ] `types/common.ts` - Shared type definitions

- [ ] Create reusable utility functions
  - [ ] `utils/form-validation.ts` - Shared validation logic
  - [ ] `utils/formatting.ts` - Data formatting helpers
  - [ ] `utils/sorting.ts` - Generic sorting utilities
  - [ ] `utils/filtering.ts` - Generic filtering utilities
  - [ ] `utils/pagination.ts` - Pagination utilities

## Future Work

### Testing Infrastructure
- [ ] Create E2E tests for each component group
  - [ ] `tests/e2e/listings/` - Dedicated Listing test directory
  - [ ] `tests/e2e/sites/` - Dedicated Site test directory
  - [ ] Create selectors files for new components
    - [ ] `listings.selectors.js` - Listing-specific selectors
    - [ ] `sites.selectors.js` - Site-specific selectors

### Documentation Improvements
- [ ] Create component documentation
  - [ ] `docs/components/listings/` - Listing component docs
  - [ ] `docs/components/sites/` - Site component docs
  - [ ] `docs/patterns/` - Shared component patterns
    - [ ] `docs/patterns/form-components.md` - Form patterns
    - [ ] `docs/patterns/table-components.md` - Table patterns
    - [ ] `docs/patterns/modal-patterns.md` - Modal patterns

## Previous Tasks

### E2E Testing Standardization
- [x] Convert all E2E tests to follow the new testing pattern
- [x] Create selectors files for major component areas
- [ ] Document the new E2E testing pattern
- [ ] Create script to automate test file generation

### Next.js App Router Compatibility
- [ ] Add "use client" directive to all interactive components
- [ ] Update component organization to better align with Next.js app router
- [x] Fix login page E2E test failure by improving test detection
- [x] Fix remaining E2E test failures with proper attributes
- [ ] Add documentation on proper component organization with app router

### Unit Test Fixes
- [ ] Install missing @testing-library/dom dependency
- [ ] Fix React Testing Library configuration in Jest setup
- [ ] Fix syntax errors in test files
- [ ] Update template-based test files
- [ ] Resolve the punycode module deprecation warning

### Export Standardization Improvements
- [ ] Add export verification to CI pipeline
- [ ] Create tooling to automatically generate standardized component files
- [ ] Update project documentation with export pattern guidelines
- [ ] Add eslint rules to enforce export patterns
