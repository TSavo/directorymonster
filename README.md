# Directory Monster

An SEO-Focused Multitenancy Directory Platform built with Next.js.

## Features

- Multitenancy architecture supporting multiple directory sites
- SEO optimization for maximum visibility
- Backlink management system
- Custom domain support
- Admin dashboard for site management
- Secure API for programmatic content management

## Getting Started

### Local Development

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server (always use `&` to run it in the background):

```bash
npm run dev &
# or
yarn dev &
# or
pnpm dev &
```

This runs the server in the background so you can continue using your terminal. To bring it back to the foreground, use `fg`, and to stop it, press `Ctrl+C` or use `kill %1`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Development

For a containerized development environment:

```bash
# Start the development environment in detached mode (background)
docker-compose -f docker-compose.dev.yml up -d

# View logs while running in detached mode
docker-compose -f docker-compose.dev.yml logs -f

# Stop the development environment
docker-compose -f docker-compose.dev.yml down
```

The `-d` flag runs containers in the background (detached mode), which is recommended for development.

### Production Docker Build

To build and run a production-ready Docker container:

```bash
# Build the Docker images
npm run docker:build
# or
docker-compose build

# Start the containers
npm run docker:up
# or
docker-compose up -d

# View logs
npm run docker:logs
# or
docker-compose logs -f

# Stop the containers
npm run docker:down
# or
docker-compose down
```

## Environment Setup

Create a `.env.local` file with the following variables:

```
# Redis connection
REDIS_URL=redis://localhost:6379

# Authentication secret
AUTH_SECRET=your-auth-secret-here
```

### Redis Configuration

DirectoryMonster uses Redis for all data storage. In production environments, you'll need to:

1. Set up a Redis instance (self-hosted, Redis Cloud, AWS ElastiCache, etc.)
2. Set the `REDIS_URL` environment variable with your connection string
3. Ensure your Redis instance has persistence enabled for data durability

#### Development Without Redis

For development without Redis, the application includes an in-memory fallback:

1. Edit `src/lib/redis-client.ts` and set `USE_MEMORY_FALLBACK = true` (already enabled by default)
2. This replaces the Redis connection with an in-memory implementation
3. Suitable for development and testing but NOT recommended for production

##### Important Notes About In-Memory Redis:

1. The in-memory store is empty on startup - you must seed data for proper functionality:
   ```bash
   npm run seed
   ```

2. Data is lost when the application restarts

3. For testing, use the convenience scripts that automatically handle seeding:
   ```bash
   # Run tests with auto-seeding
   npm run test:with-seed
   npm run test:all-with-seed
   
   # Run all tests with server and auto-seeding (all-in-one)
   npm run test:with-server
   ```

4. This implementation supports the basic Redis operations needed by the application:
   - `get`/`set` - Basic key-value storage
   - `keys` - Pattern-based key searching
   - `sadd` - Set operations for search indexing
   - `del` - Key deletion

## Directory Architecture

The platform supports multiple directory sites sharing the same codebase. Each site can have its own domain or use a subdomain of the main platform.

## SEO Optimization

- SEO-friendly URL structure
- Automatic XML sitemaps
- Schema.org markup
- Meta tags optimization
- Canonical URL management

## Backlink Management

Each listing includes backlink tracking with:

- Dofollow/nofollow control
- Backlink verification
- Position optimization
- Performance metrics

## Testing

DirectoryMonster has comprehensive testing strategies to ensure proper functioning:

### Data Seeding for Tests

**Important:** Many tests require seeded data to pass. The in-memory Redis implementation will be empty when you first start, causing test failures. Always seed data before testing:

```bash
# Seed sample data for testing
npm run seed

# Run tests with auto-seeding
npm run test:with-seed
npm run test:all-with-seed

# Run tests with server and auto-seeding (single command)
npm run test:with-server  
```

### Unit and Integration Tests

Run the Jest test suite to verify core functionality:

```bash
# Run all unit tests with seeding
npm run test:with-seed

# Run only integration tests (multitenancy and page rendering)
npm run test:integration
```

### Domain Resolution Tests

Test the domain-based routing of the multitenancy system:

```bash
# Test domain-based routing with the simple script
npm run test:domain

# Run comprehensive multitenancy tests using real HTTP requests
npm run test:multitenancy
```

### Page Rendering Tests

Verify that all pages render correctly for each site:

```bash
# Test page rendering for all domains and page types
npm run test:rendering
```

### Complete Test Suite

Run all tests in sequence:

```bash
# Run all tests (unit, domain, multitenancy, rendering)
npm run test:all
```

### Docker Testing

Test the complete application in Docker:

```bash
# Run all tests in the Docker environment
npm run test:docker
```

This will:
1. Check if the application is running and start it if needed
2. Verify Redis connectivity
3. Run all test suites
4. Provide a comprehensive test report

#### Testing locally with custom domains

For testing with custom domains locally, add the following entries to your `/etc/hosts` file:

```
127.0.0.1 fishinggearreviews.com
127.0.0.1 hikinggearreviews.com
127.0.0.1 fishing-gear.mydirectory.com
127.0.0.1 hiking-gear.mydirectory.com
```

Alternatively, use the `?hostname=` query parameter in development for testing without modifying your hosts file.

### Test Coverage

The test suite covers:

1. **Multitenancy Infrastructure**
   - Domain resolution
   - Subdomain resolution
   - Hostname normalization
   - Site identity detection

2. **Page Rendering**
   - Homepage content for each site
   - Category pages and listings
   - Listing detail pages with backlinks
   - Admin interface

3. **API Endpoints**
   - Site information
   - Categories and listings
   - Health checks
   - Search functionality

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Redis Documentation](https://redis.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)