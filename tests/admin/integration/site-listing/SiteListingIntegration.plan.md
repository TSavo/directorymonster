# Site-Listing Integration Test Plan

## Test Overview

These integration tests will verify the data flow between site management and listing management components, ensuring that the relationship between sites and listings is properly maintained throughout the application.

## Test Organization

Following the project's best practices from CLAUDE.md, we'll create small, modular tests with one test file per scenario:

```
tests/admin/integration/site-listing/
├── FilterListingsBySite.test.tsx       # Test listing filtering by site
├── ListingCreationWithSite.test.tsx    # Test creation of listings with site association
├── ListingSiteAssociation.test.tsx     # Test proper association between listings and sites
├── SiteListingDataLoading.test.tsx     # Test data loading when switching between sites
└── SiteListingOperations.test.tsx      # Test site-specific listing operations
```

## Test Cases

### 1. FilterListingsBySite.test.tsx
- Test that listings are correctly filtered when a site is selected
- Verify filter UI updates to reflect the selected site
- Test clearing site filter returns to all listings
- Test filtering by multiple sites (if supported)

### 2. ListingCreationWithSite.test.tsx
- Test creating a new listing with a specific site selected
- Verify the listing form pre-selects the site when a site context is provided
- Test validation of site-specific fields during listing creation
- Test site selection UI in listing creation form

### 3. ListingSiteAssociation.test.tsx
- Test that listings correctly display their associated site information
- Verify site data is properly loaded and displayed in listing details
- Test navigation between site and associated listings
- Verify listing counts per site are accurate

### 4. SiteListingDataLoading.test.tsx
- Test data loading states when switching between sites
- Verify proper loading indicators when loading site-specific listings
- Test error handling when site data cannot be loaded
- Test caching behavior for previously loaded site-listing data

### 5. SiteListingOperations.test.tsx
- Test updating a listing's site association
- Test deleting a listing within a site context
- Test bulk operations on listings within a site
- Verify site constraints are enforced during listing operations

## Implementation Approach

For each test file:
1. Mock both site and listing data services
2. Render the necessary components with proper context providers
3. Verify the initial state reflects the expected relationship
4. Perform interactions to test the specific scenario
5. Assert that data flow and component state updates as expected

All tests will follow the project's best practices:
- Use data-testid attributes for stable selections
- Test behavior rather than implementation details
- Include accessibility testing for key interactive components
- Follow a consistent pattern across all test files
