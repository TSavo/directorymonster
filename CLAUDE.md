# DirectoryMonster Guidelines

## Development Environment Setup

**IMPORTANT: Always use Docker for development testing with hot reloading. Always start Docker dev first using docker compose before making changes or running tests.**

```bash
# Start the Docker development environment first
docker-compose up -d

# Then make code changes - they will be automatically detected with hot reloading

# To view logs (helpful for debugging)
docker-compose logs -f
```

For Windows users, use the convenience scripts:

```bash
# Start development environment with hot reloading
start-dev.bat

# Quick restart without rebuilding (if server needs to be restarted)
dev-reload.bat

# Complete rebuild when dependencies change
rebuild-dev.bat
```

This setup ensures:
- Consistent development environment across all team members
- Hot reloading for immediate feedback during development
- Proper Redis connection configuration
- Working multitenancy with domain resolution

Refer to [DOCKER-DEV.md](DOCKER-DEV.md) for detailed information about Docker development configuration.

## Integration Architecture

DirectoryMonster consists of two main components that work together:

1. **Next.js Web Application**
   - Multi-tenant directory website with API endpoints
   - Redis database (with in-memory fallback option)
   - Serves content to end users and accepts content via API

2. **Python Scraper**
   - Selenium-based web scraper with AI capabilities
   - Extracts structured product/topic data using Ollama LLM
   - Saves data via `EndpointSaver` implementations

### Data Flow Diagram

```
[Python Scraper] → [EndpointSaver] → [Next.js API] → [Redis Database] → [Website Frontend]
```

### Data Pipeline

1. Python scraper finds relevant pages and extracts data
2. AI enriches and structures the data (using Ollama)
3. EndpointSaver sends data to Next.js API endpoints
4. Next.js stores data in Redis and serves it via the website

### Implementations

- **FileEndpointSaver**: Saves data to JSON files (default implementation)
- **APIEndpointSaver**: Saves data directly to the Next.js API endpoints (enables full automation)

## Category Management System

DirectoryMonster includes a comprehensive category management system with support for hierarchical relationships:

### Component Architecture

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

### Key Features

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

### Integration

To use the CategoryTable component in your admin pages:

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

### Testing

The category management system has comprehensive test coverage:

```bash
# Run category management tests
npm test -- -t "CategoryTable"
```

Each component has dedicated test files that verify functionality, accessibility, and error handling.

## CSS Configuration

### Tailwind CSS Setup

DirectoryMonster uses Tailwind CSS for styling, which requires specific configuration in the Docker environment:

1. **CSS Import Syntax**: Use `@import` instead of `@tailwind` directives to avoid CSS processing errors:
   ```css
   /* Use @import instead of @tailwind to fix the CSS processing error */
   @import 'tailwindcss/base';
   @import 'tailwindcss/components';
   @import 'tailwindcss/utilities';
   ```

2. **PostCSS Configuration**: Use the following configuration for proper CSS processing:
   ```js
   module.exports = {
     plugins: {
       'tailwindcss/nesting': {},
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

3. **Dependencies**: Ensure all required dependencies are installed:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

### React Component Guidelines

When working with Next.js App Router and React components:

1. **Server Components**: Fetch all data at the top level of server components and never use async components inside client components.

2. **Data Flow**: Pre-process data before rendering (sorting, filtering, etc.) and pass it down to child components as props.

3. **Avoid Async Functions**: Do not use async functions directly inside React components; instead, fetch data upfront and pass it as props.

## Test Commands

```bash
# Unit tests (Jest)
npm test

# Run tests with watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- path/to/test/file.test.tsx

# Run tests matching a specific pattern
npm test -- -t "ComponentName"

# Integration tests (Jest)
npm run test:integration 

# Domain resolution tests (Bash)
npm run test:domain

# Page rendering tests (Bash)
npm run test:rendering

# Comprehensive multitenancy tests (Bash)
npm run test:multitenancy

# All tests combined
npm run test:all

# Docker environment tests
npm run test:docker
```

## Test Suite Organization

### Component Test Files

Component tests should be organized to mirror the component structure:

```
tests/
  └── admin/
      ├── categories/
      │   ├── CategoryTable.test.tsx
      │   ├── useCategories.test.tsx
      │   └── components/
      │       ├── CategoryTableRow.test.tsx
      │       ├── CategoryTableRow.hierarchy.test.tsx    # Feature-specific test file
      │       ├── CategoryTableRow.sorting.test.tsx     # Feature-specific test file
      │       ├── CategoryTableRow.actions.test.tsx     # Feature-specific test file 
      │       ├── CategoryTableRow.accessibility.test.tsx # Accessibility-focused tests
      │       ├── CategoryTableHeader.test.tsx
      │       ├── CategoryTablePagination.test.tsx
      │       ├── CategoryTableError.test.tsx
      │       ├── CategoryTableSkeleton.test.tsx
      │       ├── CategoryTableEmptyState.test.tsx
      │       └── DeleteConfirmationModal.test.tsx
      └── listings/
          ├── ListingTable.test.tsx
          ├── useListings.test.tsx
          └── components/
              ├── ListingTableRow.test.tsx
              └── ListingTableHeader.test.tsx
```

#### Test File Organization Patterns

For complex components, we recommend organizing tests into multiple files based on features:

1. **Base Test File**: Core functionality, basic rendering, and structure tests
   - Example: `ComponentName.test.tsx`

2. **Feature-Specific Files**: Tests focusing on a specific aspect of the component
   - Example: `ComponentName.feature.test.tsx`

3. **Accessibility Files**: Tests focusing on ARIA attributes, keyboard navigation, etc.
   - Example: `ComponentName.accessibility.test.tsx`

This approach improves test clarity, maintenance, and allows developers to focus on specific aspects of a component.

### Test Scripts in package.json

The following scripts should be added to package.json for comprehensive testing:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:components": "jest --testPathPattern='tests/.*\\.test\\.(ts|tsx)$'",
    "test:api": "jest --testPathPattern='tests/api/.*\\.test\\.ts$'",
    "test:unit": "jest --testPathPattern='tests/unit/.*\\.test\\.ts$'",
    "test:integration": "jest --testPathPattern='tests/integration/.*\\.test\\.(ts|tsx)$'",
    "test:domain": "bash tests/scripts/domain-tests.sh",
    "test:rendering": "bash tests/scripts/rendering-tests.sh",
    "test:multitenancy": "bash tests/scripts/multitenancy-tests.sh",
    "test:all": "npm run test:components && npm run test:api && npm run test:integration && npm run test:domain && npm run test:rendering && npm run test:multitenancy",
    "test:docker": "docker-compose -f docker-compose.test.yml up --build --exit-code-from test",
    "test:with-seed": "node scripts/seed.js && npm test",
    "test:all-with-seed": "node scripts/seed.js && npm run test:all",
    "test:with-server": "node scripts/seed.js && (npm run dev &) && sleep 5 && npm test && kill %1"
  }
}
```

## Test Types

1. **Unit Tests**
   - Tests individual functions and components
   - Mock dependencies for isolated testing
   - Focus on code correctness

2. **Integration Tests**
   - Tests interactions between multiple components
   - Simulates hostname resolution and site identity
   - Verifies data flow through the application

3. **Domain Resolution Tests**
   - Tests real HTTP requests with Host headers
   - Verifies that the application correctly identifies sites by domain
   - Tests subdomain resolution and hostname normalization

4. **Page Rendering Tests**
   - Tests all page types (home, categories, listings)
   - Verifies correct content is shown for each site
   - Tests that one site's content doesn't appear on another site

5. **Docker Testing**
   - Tests the complete application in the Docker environment
   - Verifies Redis connectivity
   - Runs all test suites in sequence

## Running Tests

### Prerequisites
- For unit and integration tests:
  - Node.js and npm
  - Install dependencies: `npm install`

- For HTTP/domain tests:
  - Running application (`npm run dev &` or Docker) - always run development servers with `&` to keep them in the background
  - Seeded data (run `npm run seed` before testing)
  - Local hosts file entries or `?hostname=` parameter
  
### Redis and Data Requirements

For tests to pass, they require:

1. **In-memory Redis Fallback**: When Redis is not available, the application automatically uses an in-memory fallback. This is configured in `src/lib/redis-client.ts` with `USE_MEMORY_FALLBACK = true`.

2. **Seeded Data**: Many tests rely on seeded sample data. When using the in-memory Redis implementation, you must run `npm run seed` before testing, or use these convenience scripts:
   - `npm run test:with-seed`: Seeds data and runs unit tests
   - `npm run test:all-with-seed`: Seeds data and runs all tests 
   - `npm run test:with-server`: Seeds data, starts the server, and runs tests

This fallback makes development easier by eliminating the need for Redis installation.

### Common Issues

1. **CSS Processing Errors**:
   - If you see errors about "@tailwind" directives, check globals.css and make sure it uses @import syntax instead
   - Verify PostCSS config includes all necessary plugins
   - Ensure all dependencies are installed in the Docker container

2. **React Component Errors**:
   - Error: "Functions are not valid as a child of Client Components"
   - Solution: Avoid using async functions directly within React components 
   - Fix: Fetch all data at the top level of server components and pass it as props

3. **Missing Jest Environment**
   ```
   npm install --save-dev jest-environment-jsdom
   ```

4. **Missing Testing Library**
   ```
   npm install --save-dev @testing-library/jest-dom
   ```

5. **Connection Errors**
   - Ensure application is running on port 3000
   - Check hosts file for domain entries
   - Ensure Redis is running

6. **Mock Failures**
   - Check mock implementations in test files
   - Ensure mocks are reset between tests
   - Use mockImplementation for complex mocks

## Docker Configuration

### Development Setup

Use the following docker-compose configuration for development:

```yaml
version: '3'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - AUTH_SECRET=development-auth-secret
      - NEXT_PUBLIC_BASE_URL=http://localhost:3000
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
    depends_on:
      - redis
    extra_hosts:
      - "fishinggearreviews.com:127.0.0.1"
      - "hikinggearreviews.com:127.0.0.1"
      - "fishing-gear.mydirectory.com:127.0.0.1"
      - "hiking-gear.mydirectory.com:127.0.0.1"
      - "mydirectory.com:127.0.0.1"

  redis:
    image: redis:alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

### Development Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Install tailwindcss and postcss dependencies explicitly
RUN npm install -D tailwindcss postcss autoprefixer

# Copy the rest of the application
COPY . .

# Run the dev server
CMD ["npm", "run", "dev"]
```

## Test Coverage Expectations

- Unit tests: 70-80% coverage
- Integration tests: Key user flows
- Domain tests: All registered domains
- Page tests: All page types for each site

## Component Testing Best Practices

### Component Tests

1. **Use Data Attributes for Selection**
   - Add `data-testid` attributes to all key elements in components
   - Use specific and descriptive test IDs (e.g., `cancel-button` not `button-1`)
   - Scope queries to specific components using `within()`
   - Prefer `getByTestId()` over `getByText()` or `getByRole()` when possible

2. **Test Behavior, Not Implementation**
   - Focus on component behavior and user interactions
   - Avoid testing implementation details like state variables or props
   - Test UI changes in response to user actions
   - Verify correct function calls with mock functions

3. **Accessibility Testing**
   - Verify proper ARIA attributes (`aria-label`, `aria-labelledby`, etc.)
   - Test keyboard navigation and focus management
   - Ensure focus trapping in modals and dialogs
   - Verify proper tab order and keyboard interactions

4. **Reduce CSS Coupling**
   - Avoid selecting elements by CSS classes when possible
   - Use flexible class matchers when necessary (`toHaveClass` with partial matches)
   - Focus on functional attributes rather than styling
   - If testing CSS-related functionality, use more general attribute matchers

5. **Test Edge Cases**
   - Test empty states and zero-item scenarios
   - Verify error handling and loading states
   - Test boundary conditions (e.g., first/last page in pagination)
   - Include tests for unexpected or invalid input

6. **Focus Management Testing**
   - Use `waitFor()` with focus assertions to handle async focus changes
   - Test focus restoration when components are unmounted and remounted
   - Verify focus is set correctly on initial render
   - Test focus cycling with Tab key navigation

7. **Organization and Documentation**
   - Group tests logically by functionality
   - Use descriptive test names that explain the expected behavior
   - Add comments to clarify test assertions and setup
   - Include references to accessibility guidelines when relevant

8. **Examples**

   Good test (using data-testid):
   ```tsx
   it('calls onCancel when backdrop is clicked', () => {
     render(<MyModal isOpen={true} onCancel={mockOnCancel} />);
     const backdrop = screen.getByTestId('modal-backdrop');
     fireEvent.click(backdrop);
     expect(mockOnCancel).toHaveBeenCalledTimes(1);
   });
   ```

   Good accessibility test:
   ```tsx
   it('properly traps focus within modal', async () => {
     const user = userEvent.setup();
     render(<MyModal isOpen={true} />);
     
     // Tab to last element
     await user.tab();
     await user.tab();
     
     // Tab again should cycle to first element
     await user.tab();
     expect(document.activeElement).toBe(screen.getByTestId('first-focusable'));
   });
   ```

### React Hook Testing

1. **Isolate Tests From Side Effects**
   - Avoid testing `useEffect` side effects directly
   - Mock external dependencies like `fetch` with specific implementations per test
   - Use `cleanup` between tests to prevent state leakage
   - Restore original function implementations in `afterEach`

2. **Handle Asynchronous Updates**
   - Use `act()` to wrap state updates
   - For async operations, use `async/await` within `act()` calls
   - Use `waitFor()` instead of deprecated `waitForNextUpdate()`
   - Account for multiple state updates in a single operation

3. **Test Hook Behavior, Not Implementation**
   - Test return values and state updates, not internal functions
   - Focus on public API of the hook
   - Verify state changes in response to function calls
   - Test how consumers would use the hook

4. **Use Separate Hook Instances for Complex Tests**
   - Create fresh hook instances for testing multi-step operations
   - Avoid testing multiple state transitions in a single test
   - Use multiple `renderHook` calls for different scenarios

5. **Example**

   Good hook test:
   ```tsx
   it('should handle search filtering correctly', () => {
     const { result } = renderHook(() => useCategories(undefined, mockData));
     
     act(() => {
       result.current.setSearchTerm('Test');
     });
     
     expect(result.current.filteredCategories.length).toBe(1);
     expect(result.current.filteredCategories[0].name).toBe('Test Item');
     
     act(() => {
       result.current.setSearchTerm('');
     });
     
     expect(result.current.filteredCategories.length).toBe(mockData.length);
   });
   ```

## GitHub CLI (gh) Integration

GitHub CLI (`gh`) is used for managing the CI/CD pipeline and interacting with GitHub repositories.

### Installation

```bash
# Windows (using winget)
winget install GitHub.cli

# macOS (using Homebrew)
brew install gh

# Linux (using apt)
type -p curl >/dev/null || apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
apt update
apt install gh -y
```

### Authentication

Authenticate with GitHub before using the CLI:

```bash
gh auth login
```

### Common Commands

1. **Pull Requests**
   ```bash
   # Create a PR
   gh pr create --title "PR Title" --body "PR description" --base main --head branch-name
   
   # List PRs
   gh pr list
   
   # View a specific PR
   gh pr view 1
   
   # Check PR status
   gh pr checks 1
   
   # Merge a PR
   gh pr merge 1 --merge
   ```

2. **CI/CD Workflows**
   ```bash
   # List workflow runs
   gh run list --workflow=".github/workflows/ci.yml" --limit=5
   
   # View a specific run
   gh run view 12345678
   
   # View logs of a failed run
   gh run view 12345678 --log-failed
   ```

3. **Repository Management**
   ```bash
   # Clone a repository
   gh repo clone username/repo-name
   
   # Create a new repository
   gh repo create repo-name --public
   
   # Fork a repository
   gh repo fork username/repo-name
   ```

### GitHub CI Integration

For the DirectoryMonster project, GitHub CLI is essential for:

1. **Automating PR creation and management** during the development workflow
2. **Monitoring CI pipeline status** to ensure tests pass
3. **Debugging workflow issues** by accessing run logs
4. **Managing repository settings** without using the web interface

When working with the CI pipeline, use gh commands to verify that workflow runs are successful before merging changes to main branches.

## Continuous Integration

The test suite is designed to run in CI environments:

1. Run linting and type checking
   ```
   npm run lint && npm run typecheck
   ```

2. Run unit and integration tests
   ```
   npm test
   ```

3. Start application and run domain/rendering tests
   ```
   npm run docker:up && npm run test:docker
   ```

## Development Best Practices

1. **Always Use Docker for Development**
   - Always start Docker development environment first:
     ```bash
     docker-compose up -d
     # or using the convenience script:
     start-dev.bat
     ```
   - Make code changes locally - they will be automatically detected with hot reloading
   - To restart the Next.js server without rebuilding:
     ```bash
     dev-reload.bat
     ```
   - For complete rebuild when dependencies change:
     ```bash
     rebuild-dev.bat
     ```

2. **Working with Redis**
   - If Redis is not available, the app can use an in-memory fallback (configured in `src/lib/redis-client.ts`)
   - For production, always use a proper Redis instance

3. **CSS Processing**
   - Use @import instead of @tailwind in CSS files
   - Keep PostCSS config up to date with the necessary plugins
   - Test CSS changes thoroughly across different components

4. **Component Architecture**
   - Keep data fetching at the top level of server components
   - Pre-process data before rendering
   - Pass data down as props to child components
   - Avoid async components inside client components

5. **Admin Components**
   - AdminLayout provides consistent structure for all admin pages
   - WithAuth protects admin routes with authentication
   - AdminSidebar provides responsive navigation with mobile support
   - AdminHeader includes user controls and notifications
   - Breadcrumbs automatically generates path-based navigation
   - ListingTable provides comprehensive listing management
   - CategoryTable provides hierarchical category management
   - See `/src/components/admin/layout/README.md` for detailed documentation

6. **URL Construction**
   - Always use the URL utility functions in `src/lib/site-utils.ts` to construct URLs
   - For components, use the Link wrapper components in `src/components/LinkUtilities.tsx`
   - See `docs/url-utilities.md` for detailed documentation and examples
   - Follow these patterns to ensure consistent URL construction across the application
   
7. **Python Scraper Integration**
   - To create a full automation pipeline, implement the `APIEndpointSaver` class
   - Configure with correct API endpoints and site slugs
   - Test with small batches before large-scale scraping

## Troubleshooting Common Issues

1. **CSS Processing Errors**
   - Check globals.css for @import syntax
   - Verify PostCSS config includes all necessary plugins
   - Ensure all dependencies are installed

2. **React Component Errors**
   - Move all async operations to the top level
   - Pre-process data before rendering
   - Pass data down as props
   - Avoid using async functions inside components

3. **Docker Configuration Issues**
   - Check volume mounting for proper file access
   - Verify environment variables are set correctly
   - Ensure dependencies are installed in the container

4. **Data Seeding Problems**
   - Run the official seed script (`npm run seed`)
   - Check for errors in the seeding process
   - Verify data was properly created in Redis