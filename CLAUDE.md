# DirectoryMonster Development Guide

## Development Setup

**IMPORTANT: Always use Docker for development with the dedicated dev configuration.**

```bash
# Start Docker development environment (recommended)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Windows convenience scripts (using docker-compose.dev.yml automatically)
start-dev.bat     # Start environment
dev-reload.bat    # Fast restart
rebuild-dev.bat   # Full rebuild with dependencies
```

The `.dev.yml` configuration provides optimized development features:
- Enhanced hot reloading with file watching
- Development-specific volume mappings
- Additional debugging tools
- Pre-configured environment variables
- Memory-optimized services

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

### Data Flow

```
[Python Scraper] → [EndpointSaver] → [Next.js API] → [Redis] → [Frontend]
```

## Component Structure

All components follow modular architecture with clear separation of concerns:

### Example: Category Management

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

Use the same pattern for all feature areas:
- One container component that imports subcomponents
- Data management through custom hooks
- Shared types in a dedicated file
- Small, focused UI components

## React Guidelines

1. **Server Components**
   - Fetch data at the top level of server components
   - Never use async components inside client components
   - Pre-process data before passing to child components

2. **CSS With Tailwind**
   - Use `@import` instead of `@tailwind` directives:
     ```css
     @import 'tailwindcss/base';
     @import 'tailwindcss/components';
     @import 'tailwindcss/utilities';
     ```
   - Follow mobile-first responsive design
   - Use utility classes consistently

3. **Component Structure**
   - Small, focused components with single responsibility
   - Props-based data flow
   - Explicit TypeScript interfaces

## Testing

### Commands

```bash
# Unit tests
npm test

# Specific component
npm test -- -t "ComponentName"

# Integration tests
npm run test:integration

# Domain resolution tests
npm run test:domain

# All tests with data seeding
npm run test:all-with-seed

# Docker environment tests
npm run test:docker
```

### Test Organization

Organize tests to mirror component structure:

```
tests/
└── admin/
    ├── categories/
    │   ├── CategoryTable.test.tsx        # Core tests
    │   ├── CategoryTable.sorting.test.tsx # Feature tests
    │   └── components/
    │       └── CategoryTableRow.test.tsx
    └── listings/
        └── ...
```

### Best Practices

1. **Use data-testid Attributes**
   ```tsx
   <button data-testid="save-button">Save</button>
   ```

2. **Test Behavior, Not Implementation**
   ```tsx
   // Good: Tests behavior
   it('submits form on button click', () => {
     render(<MyForm onSubmit={mockSubmit} />);
     fireEvent.click(screen.getByTestId('submit-button'));
     expect(mockSubmit).toHaveBeenCalled();
   });
   ```

3. **Test Accessibility**
   - Verify ARIA attributes
   - Test keyboard navigation
   - Check focus management

4. **Hook Testing**
   ```tsx
   it('filters data correctly', () => {
     const { result } = renderHook(() => useMyHook(mockData));
     act(() => { result.current.setFilter('test'); });
     expect(result.current.filteredItems).toHaveLength(1);
   });
   ```

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

4. **Redux Integration**
   - Use RTK Query for API interactions
   - Follow the slice pattern for state management
   - Leverage the custom hooks for component integration

## Git Workflow

1. **Feature Branches**
   - Create from main: `git checkout -b feature/name`
   - Descriptive branch names: `feature/category-management`

2. **Pull Requests**
   - Comprehensive testing before submission
   - Clear description of changes
   - Reference issues: `Fixes #123`

3. **CI Pipeline**
   - Tests run automatically on PR
   - All tests must pass before merging
   - Monitor status with GitHub CLI: `gh pr checks 123`