# DirectoryMonster Guidelines

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

1. **Running Development Servers**
   - Always run continuous processes like development servers in the background using `&`:
     ```bash
     npm run dev &
     ```
   - This allows you to continue using the terminal for other commands
   - To bring the process back to the foreground: `fg`
   - To stop the background process: `kill %1` or find the PID with `ps` and use `kill [PID]`

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

5. **URL Construction**
   - Always use the URL utility functions in `src/lib/site-utils.ts` to construct URLs
   - For components, use the Link wrapper components in `src/components/LinkUtilities.tsx`
   - See `docs/url-utilities.md` for detailed documentation and examples
   - Follow these patterns to ensure consistent URL construction across the application
   
6. **Python Scraper Integration**
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