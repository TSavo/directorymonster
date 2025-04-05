# Contributing to DirectoryMonster

Thank you for considering a contribution to DirectoryMonster! This document outlines the guidelines and workflow for contributing to this project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment:
   - Redis is optional - the app will use an in-memory fallback
   - To use Redis, set `USE_MEMORY_FALLBACK = false` in `src/lib/redis-client.ts`

4. Seed sample data:
   ```bash
   # Local development
   npm run data:seed

   # With Docker
   npm run data:seed:docker
   ```

   All seeding is done through the API to ensure proper validation. See [docs/seeding.md](docs/seeding.md) for more details.

5. Start the development server:
   ```bash
   npm run app:dev &
   ```

## Testing

Please ensure all tests pass before submitting a PR:

```bash
# Run all tests
npm run test

# Run tests with seeding
npm run test:with:seed

# Run tests with Docker seeding
npm run test:with:seed:docker

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:api
npm run test:components
```

Read the [testing documentation](./CLAUDE.md) for more details.

## Pull Request Process

1. Create a new branch from `main`
2. Make your changes
3. Add or update tests as necessary
4. Ensure all tests pass
5. Update documentation if needed
6. Submit your PR with a clear description of the changes

## Code Style

- Follow the existing code style and patterns
- Use TypeScript for all new files
- Ensure your code passes ESLint and TypeScript checks:
  ```bash
  npm run app:lint
  npm run app:typecheck
  ```

## Component Architecture

### Admin Components

When working with admin components, follow these guidelines:

1. Use a modular component structure
   - Each major component should be broken down into smaller, focused subcomponents
   - Store related components in a directory structure by feature area (e.g., `admin/listings/`)
   - Use an `index.ts` file for clean exports

2. Implement custom hooks for data management
   - Store data management logic in custom hooks (e.g., `useListings.ts`)
   - Place hooks in a separate `hooks` directory within the feature area

3. TypeScript types
   - Define component props interfaces in a `types.ts` file
   - Use specific and descriptive type names
   - Export types for reuse when appropriate

4. Utility functions
   - Extract repeated logic into utility functions in a `utils.ts` file
   - Keep utility functions pure and testable

5. Testing
   - Create comprehensive tests for each component
   - Test both the main component and its subcomponents
   - Mock data and API calls appropriately

## URL Construction

DirectoryMonster uses a consistent approach to URL construction throughout the application. Always follow these patterns when working with URLs:

### Utility Functions

Always use the URL utility functions in `src/lib/site-utils.ts`:

- `generateSiteBaseUrl(site)`: For site base URLs (with domain)
- `generateCategoryUrl(site, categorySlug)`: For category page URLs (with domain)
- `generateListingUrl(site, categorySlug, listingSlug)`: For listing page URLs (with domain)
- `generateCategoryHref(categorySlug)`: For relative category paths (for Next.js Link)
- `generateListingHref(categorySlug, listingSlug)`: For relative listing paths (for Next.js Link)

### Component Wrappers

For React components that need links, use the Link wrappers in `src/components/LinkUtilities.tsx`:

- `<CategoryLink category={category}>Text</CategoryLink>`: For category links
- `<ListingLink listing={listing}>Text</ListingLink>`: For listing links
- `<ListingLinkWithCategory categorySlug="..." listingSlug="...">Text</ListingLinkWithCategory>`: For direct links

### Implementation Notes

1. When working with listings, make sure to populate the `categorySlug` property for proper URL construction
2. In category pages, add the `categorySlug` to each listing before passing it to components
3. Always use the utility functions - never hardcode URL patterns

For comprehensive documentation on URL construction, see [docs/url-utilities.md](docs/url-utilities.md).

## Issues and Features

- Search existing issues before creating a new one
- Use issue templates where provided
- Be specific about the problem or feature request

Thank you for your contribution!