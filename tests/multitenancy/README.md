# Multi-tenancy Test Suite

This directory contains tests specifically for the multi-tenant functionality of DirectoryMonster.

## Test Structure

- `tenant-service.test.ts` - Tests for the TenantService functionality
- `middleware.test.ts` - Tests for the tenant middleware

## Running Tests

To run these tests:

```bash
# Run with Node environment (not jsdom)
npm test -- --testEnvironment=node tests/multitenancy

# Run specific test file
npm test -- tests/multitenancy/tenant-service.test.ts
```

## Test Coverage

The tests cover:

1. Tenant creation and management
2. Hostname normalization and routing
3. Multi-tenant routing through middleware
4. Redis storage and retrieval
5. Error handling

## Test Data

The tests use in-memory data and don't require an actual Redis server connection.
Each test cleans up after itself to avoid cross-test contamination.