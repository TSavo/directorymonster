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
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev &
   ```

## Testing

Please ensure all tests pass before submitting a PR:

```bash
# Run tests with seeding
npm run test:with-seed

# Run all tests including domain resolution
npm run test:all-with-seed

# Run a complete test with server setup
npm run test:with-server
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
  npm run lint
  npm run typecheck
  ```

## Issues and Features

- Search existing issues before creating a new one
- Use issue templates where provided
- Be specific about the problem or feature request

Thank you for your contribution!