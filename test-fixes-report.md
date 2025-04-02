# Test Fixes Report

## Summary

Fixed mismatched data-testid attributes in the following test files:

1. `tests/SiteHeader.test.tsx`
2. `tests/ListingCard.test.tsx`
3. `tests/LinkUtilities.test.tsx`

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

## Approach

For each test file, we:

1. Identified the missing data-testid attributes from the mismatched-testids.json file
2. Examined the component and test files to understand the issue
3. Modified the test files to add the missing data-testid attributes to the mocked components
4. Updated the test assertions to use the new data-testid attributes
5. Ran the tests to verify that the changes fixed the issues

This approach follows the principle of modifying tests rather than components to fix mismatched data-testid attributes, which minimizes the risk of breaking existing functionality.

## Next Steps

There are still many more mismatched data-testid attributes to fix in other test files. The same approach can be applied to those files:

1. Add the missing data-testid attributes to the mocked components
2. Update the test assertions to use the new data-testid attributes
3. Run the tests to verify that the changes fixed the issues

A script could be developed to automate this process for the remaining files.
