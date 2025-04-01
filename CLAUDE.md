# DirectoryMonster Development Guide

## GitHub Issue Tracking

**IMPORTANT: All tasks, bugs, and features are tracked exclusively via GitHub Issues.**

### Issue Management

```bash
# View all issues
gh issue list --repo TSavo/directorymonster

# View high priority issues
gh issue list --repo TSavo/directorymonster --label "priority:high"

# View issue details
gh issue view 9 --repo TSavo/directorymonster

# Create new issue
gh issue create --repo TSavo/directorymonster

# Close completed issue
gh issue close 9 --repo TSavo/directorymonster
```

### Working on Issues

1. **Mark as in-progress**:
   ```bash
   gh issue edit 9 --add-label "status:in-progress"
   ```

2. **Create branch for the issue**:
   ```bash
   git checkout -b fix/issue-9-listings-hook
   ```

3. **Reference issue in commits**:
   ```bash
   git commit -m "Fix useListings hook implementation #9"
   ```

4. **Update issue when making progress**:
   ```bash
   gh issue comment 9 --body "Fixed the setSearchTerm function, working on tests"
   ```

## Test-Driven Development

**CRITICAL: All features MUST be developed using Test-Driven Development (TDD).**

### TDD Workflow

1. **Write tests first**:
   ```bash
   # Create test file before implementation
   touch tests/unit/component-name.test.ts
   ```

2. **Follow the Red-Green-Refactor cycle**:
   - **Red**: Write a failing test
     ```bash
     npx jest -t "should perform specific behavior"
     # Verify test fails
     ```
   - **Green**: Write minimal code to pass the test
     ```bash
     # Implement minimal code
     npx jest -t "should perform specific behavior"
     # Verify test passes
     ```
   - **Refactor**: Clean up code while tests pass
     ```bash
     # Refactor implementation
     npx jest -t "should perform specific behavior"
     # Verify test still passes
     ```

3. **Tests first for each feature**: Never write implementation code without first writing tests

For detailed TDD guidelines, see [TDD Testing Specification](specs/TDD_TESTING_SPEC.md).

## Development Setup

Always use Docker for development with the dedicated dev configuration:

```bash
# Start environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Windows convenience scripts
start-dev.bat     # Start environment
dev-reload.bat    # Fast restart
rebuild-dev.bat   # Full rebuild
```

## Project Architecture

### Components

1. **Next.js Application**
   - Multi-tenant directory sites
   - Redis storage with in-memory fallback
   - SEO-optimized content delivery

2. **Python Scraper**
   - AI-powered data extraction
   - Automated categorization
   - Flexible export via EndpointSaver

### Component Structure

Follow modular architecture with clear separation of concerns:

```
src/components/admin/categories/
├── CategoryTable.tsx           # Container component
├── hooks/useCategories.ts      # Data management
├── types.ts                    # Type definitions
└── components/                 # UI components
    ├── CategoryTableRow.tsx    # Individual row
    ├── CategoryTableHeader.tsx # Search and filters
    └── ...                     # Additional components
```

## React Guidelines

1. **Server Components**
   - Fetch data at the top level of server components
   - Never use async components inside client components
   - Pre-process data before passing to child components

2. **CSS With Tailwind**
   - Use `@import` instead of `@tailwind` directives
   - Follow mobile-first responsive design
   - Use utility classes consistently

3. **Testing**
   - Always follow TDD workflow
   - Use data-testid attributes
   - Test behavior, not implementation
   - Organize tests to mirror component structure

## Security Guidelines

1. **Tenant Isolation**
   - Always use security middleware for tenant validation
   - Use `withSecureTenantContext` for basic tenant validation
   - Use `withSecureTenantPermission` when permissions are needed
   - Refer to [Tenant Security Guide](docs/TENANT_SECURITY_GUIDE.md) for details

2. **Security Best Practices**
   - Always include tenant context in service calls
   - Check for cross-tenant access in request content
   - Use `detectCrossTenantAccess` utility for content validation
   - Never expose tenant IDs in URLs or client-side code

3. **Security Testing**
   - Verify tenant isolation in test cases
   - Mock context validation in unit tests
   - Test cross-tenant access prevention
   - Consult [Testing Strategy](docs/testing.md) for more details

## Common Issues

1. **CSS Processing**
   - Use `@import` instead of `@tailwind`
   - Verify PostCSS configuration
   - Check dependencies installation

2. **React Component Errors**
   - Avoid async functions in client components
   - Move data fetching to server components
   - Pass processed data via props

3. **Testing Issues**
   - Always seed data: `npm run seed`
   - Check Redis connection/fallback
   - Use domain mocking or `?hostname=` parameter

4. **Security Issues**
   - Verify tenant context validation in middleware
   - Ensure all resources include tenant checks
   - Fix cross-tenant detection in requests and responses
   - Follow security patterns in [Tenant Security Guide](docs/TENANT_SECURITY_GUIDE.md)

5. **Git Workflow**
   - Always reference issues in commits and PRs
   - Keep PRs focused on single issues when possible
   - Tests must pass before merging