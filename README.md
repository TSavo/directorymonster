# Directory Monster

An SEO-Focused Multitenancy Directory Platform built with Next.js and Python scraping capabilities.

## System Overview

DirectoryMonster consists of two main components working together:

1. **Next.js Web Application**
   - Multi-tenant directory platform with API endpoints
   - Redis storage for listings, categories and site configurations
   - SEO-optimized directory websites with customizable domains

2. **Python Scraper (in `/python` directory)**
   - AI-powered web scraping with Selenium
   - Content extraction and analysis using Ollama models
   - Pluggable EndpointSaver system for data export

## Features

- Multitenancy architecture supporting multiple directory sites
- SEO optimization for maximum visibility
- Backlink management system
- Custom domain support
- Admin dashboard for site and content management:
  - Comprehensive listing management interface
  - Complete category management system with hierarchical support
  - Site configuration controls
  - Modern, responsive admin UI with accessibility compliance
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

1. The in-memory store is empty on startup - you must seed data via the API for proper functionality:
   ```bash
   npm run seed
   ```

2. Data is lost when the application restarts

3. For testing, use the convenience scripts that automatically handle API seeding:
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

5. All data seeding is done through the API to ensure proper validation and consistency.

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

### GitHub CI Workflow

DirectoryMonster uses GitHub Actions for continuous integration testing. The CI workflow automatically runs on pushes to main, master, and dev branches, as well as on pull requests targeting these branches.

**CI Process Overview:**

1. **Environment Setup**:
   - Sets up Docker Buildx for optimized container builds
   - Configures hostname resolution for domain testing
   - Utilizes caching for npm dependencies and Docker layers

2. **Container Build & Start**:
   - Builds the application Docker image
   - Starts all required containers (app, Redis)
   - Verifies container health before proceeding

3. **Testing Sequence**:
   - Automatically seeds the database with test data
   - Runs static analysis (linting and type checking)
   - Executes unit, integration, domain, and multitenancy tests
   - Performs page rendering verification

4. **Artifacts & Logging**:
   - Captures detailed logs for all testing steps
   - Uploads logs as artifacts for debugging (retained for 7 days)
   - Ensures proper cleanup even if tests fail

**CI Benefits:**
- Ensures code quality before merging to main branches
- Catches integration issues early in the development process
- Provides consistent test environment regardless of developer setup
- Automatically documents test results for review

To view CI results, check the "Actions" tab in the GitHub repository.

DirectoryMonster has comprehensive testing strategies to ensure proper functioning:

### Python Scraper

The Python scraper component in the `/python` directory provides powerful web scraping capabilities:

```bash
# Install Python dependencies
cd python
pip install -r requirements.txt

# Run the scraper
python run_scraper.py --count 10 --categories "hiking gear" "camping equipment"
```

The scraper uses AI to identify and extract detailed information about products and topics.

### EndpointSaver System

The scraper features a pluggable EndpointSaver system that provides flexible options for saving extracted data:

1. **FileEndpointSaver**: Basic file-based storage (default)
   - Saves extracted data to JSON files
   - Output goes to `python/data/endpoints.json` by default
   - Simple implementation with minimal features

2. **EnhancedFileEndpointSaver**: Advanced file-based storage
   - Creates automatic backups before saving
   - Maintains a history of all saved endpoints
   - Detects and filters duplicates
   - Provides filtering by domain or category
   - CSV export functionality
   - Robust error handling

3. **APIEndpointSaver**: Direct integration with Next.js API
   - Creates a complete automation pipeline from scraping to website display
   - Transforms endpoint data to match API requirements
   - Automatic category lookup and creation
   - Robust error handling with retry logic
   - Configurable with API URL and site slug

To use the APIEndpointSaver, configure it in your scraper script:

```python
from scraper.api_endpoint_saver import APIEndpointSaver

# Initialize with API URL and site slug
endpoint_saver = APIEndpointSaver(
    api_base_url="http://localhost:3000/api",
    site_slug="your-site-slug",
    retry_attempts=3  # Optional: retry failed requests
)

# Pass to the SearchEngine component
search_engine = SearchEngine(
    browser.driver,
    link_selector,
    endpoint_saver=endpoint_saver,
    # other parameters...
)
```

For enhanced file-based storage:

```python
from scraper.enhanced_file_saver import EnhancedFileEndpointSaver

# Initialize with custom paths
endpoint_saver = EnhancedFileEndpointSaver(
    output_path="./data/my_endpoints.json",
    backup_directory="./data/backups",
    history_directory="./data/history",
    max_backups=5  # Keep only the 5 most recent backups
)

# Use filtering and export features
domain_results = endpoint_saver.get_by_domain("example.com")
category_results = endpoint_saver.get_by_category("hiking gear")
endpoint_saver.export_csv("./data/endpoints_export.csv")
endpoint_saver.prune_duplicates()
```

A test script is included to demonstrate all endpoint savers:

```bash
# Test all savers with sample data
python test_endpoint_savers.py --test-all

# Test only the API saver with custom settings
python test_endpoint_savers.py --test-api --api-url "http://localhost:3000/api" --site-slug "mydirectory"

# Test enhanced file saver with custom output directory
python test_endpoint_savers.py --test-enhanced --output-dir "./custom_output"
```

## Data Seeding for Tests

**Important:** Many tests require seeded data to pass. The in-memory Redis implementation will be empty when you first start, causing test failures. Always seed data through the API before testing:

```bash
# Seed sample data for testing via API
npm run seed

# For Docker environments
npm run seed:docker

# Run tests with auto-seeding
npm run test:with-seed
npm run test:all-with-seed

# Run tests with server and auto-seeding (single command)
npm run test:with-server  
```

See [docs/seeding.md](docs/seeding.md) for more details on the API-based seeding process.

### Unit and Integration Tests

Run the Jest test suite to verify core functionality:

```bash
# Run all unit tests with seeding
npm run test:with-seed

# Run specific component tests
npm test -- -t CategoryTableRow

# Run only integration tests (multitenancy and page rendering)
npm run test:integration

# Run tests with coverage report
npm test -- --coverage
```

#### Component Testing

The project uses a comprehensive testing approach for React components:

1. **Component Structure**:
   - Tests are organized to mirror the component structure
   - Complex components use multiple test files focused on specific features
   - Tests validate rendering, functionality, and accessibility

2. **Hook Testing**:
   - Custom React hooks are tested with isolated test instances
   - Mock implementations for external dependencies like fetch
   - Tests for proper state management and function behavior

3. **Test-Driven Development**:
   - Tests are implemented before components to guide development
   - Focus on behavior and user interactions, not implementation details
   - Coverage targets of 90%+ for critical components

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
   - Categories and listings with CRUD operations
   - Health checks
   - Search functionality with filtering

4. **Admin Interface**
   - Listing Management with filtering, sorting, and pagination
   - Category Management with hierarchical display and parent-child relationships
   - Authentication and authorization with ZKP (Zero-Knowledge Proof)
   - Responsive design for mobile and desktop

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Redis Documentation](https://redis.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)