# Test Fixes Report - Part 2

## Summary

Fixed mismatched data-testid attributes in the following test files:

1. `tests/SiteHeader.test.tsx`
2. `tests/ListingCard.test.tsx`
3. `tests/LinkUtilities.test.tsx`
4. `tests/admin/sites/SiteForm.validation.test.tsx`
5. `tests/admin/sites/SiteForm.submission.test.tsx`

## Details

### 1. SiteHeader.test.tsx

**Issue**: The test was looking for a `data-testid="mocked-category-link"` attribute that didn't exist in the component.

**Fix**: 
- Added `data-testid="category-link"` to the mocked CategoryLink component
- Updated the test to use `screen.getAllByTestId('category-link')` instead of `screen.getAllByText(/Category \d/)`

**Result**: All 9 tests now pass.

### 2. ListingCard.test.tsx

**Issue**: The test was looking for a `data-testid="mocked-image"` attribute that didn't exist in the component.

**Fix**:
- Added `data-testid="mocked-image"` to the mocked Image component
- Updated the tests to use `screen.getByTestId('mocked-image')` and `screen.queryByTestId('mocked-image')` instead of `screen.getByRole('img')` and `screen.queryByRole('img')`

**Result**: All 14 tests now pass.

### 3. LinkUtilities.test.tsx

**Issue**: The test was looking for a `data-testid="test-link"` attribute that didn't exist in the component.

**Fix**:
- Added a mock for the next/link component with `data-testid="test-link"`
- Updated all tests to use `screen.getByTestId('test-link')` instead of `screen.getByText()` followed by `.closest('a')`

**Result**: All 6 tests now pass.

### 4. SiteForm.validation.test.tsx and SiteForm.submission.test.tsx

**Issue**: The tests were failing with an error about the Next.js router not being mounted.

**Fix**:
- Added a mock for the `useRouter` hook from Next.js
- Updated the tests to use `data-testid="form-next-button"` instead of `data-testid="next-button"` or `data-testid="siteForm-submit"`

**Result**: The tests are still failing, but now due to component-specific issues rather than the router error. The component appears to be in a different state than expected in the tests, which would require more extensive changes to fix.

## Approach

For each test file, we:

1. Identified the missing data-testid attributes from the mismatched-testids.json file
2. Examined the component and test files to understand the issue
3. Modified the test files to add the missing data-testid attributes to the mocked components
4. Updated the test assertions to use the new data-testid attributes
5. Ran the tests to verify that the changes fixed the issues

This approach follows the principle of modifying tests rather than components to fix mismatched data-testid attributes, which minimizes the risk of breaking existing functionality.

## Next Steps

There are still issues with the SiteForm tests that need to be addressed:

1. The tests expect the form to be in a specific state, but the component is rendering a different state
2. The tests are looking for error messages and loading states that don't appear to be implemented in the component
3. The tests are trying to interact with form elements that may not be accessible in the current state of the component

To fix these issues, we would need to:

1. Update the tests to match the actual behavior of the component
2. Add the missing error handling and loading state functionality to the component
3. Ensure that the form elements are accessible in the tests

Alternatively, we could update the component to match the expected behavior in the tests, but this would be more risky as it could break existing functionality.
