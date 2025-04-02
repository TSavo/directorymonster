# Category Listings API Tests

This directory contains tests for the category listings API endpoint.

## Test Files

- `basic.test.ts`: Basic tests for the core functionality of the listings API
- `simple.test.ts`: A minimal test to verify the test setup
- `standalone.test.ts`: A more comprehensive test suite (work in progress)
- `mock-implementation.test.ts`: A test suite with a mock implementation (work in progress)

## Running Tests

To run the tests, use the following command:

```bash
npx jest tests/unit/api/sites/categories/listings/basic.test.ts
```

## Test Coverage

The tests cover the following functionality:

- Filtering listings by featured flag
- Tenant isolation for security
- Pagination of listings
- Validation of pagination parameters

## Future Improvements

- Complete the standalone test suite
- Add tests for sorting functionality
- Add tests for custom field filtering
- Add tests for search functionality