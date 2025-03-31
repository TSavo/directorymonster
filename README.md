# DirectoryMonster

An SEO-focused multitenancy directory platform with AI-powered data collection.

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/TSavo/directorymonster?utm_source=oss&utm_medium=github&utm_campaign=TSavo%2Fdirectorymonster&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Overview

DirectoryMonster is a comprehensive platform combining:

1. **Next.js Web Application**
   - Multi-tenant directory sites with custom domains
   - Redis-based data storage
   - SEO optimization with backlink management

2. **AI-Powered Python Scraper**
   - Selenium-based web scraping with LLM analysis
   - Automated data extraction and categorization
   - Flexible data export options

## Quick Start

### Docker Development (Recommended)

```bash
# Start development environment with hot reloading
docker-compose up -d

# View logs
docker-compose logs -f

# Windows convenience scripts
start-dev.bat    # Start environment
dev-reload.bat   # Quick restart
rebuild-dev.bat  # Full rebuild
```

This provides:
- Automatic hot reloading
- Redis configuration
- Multitenancy hostname resolution
- Consistent environment across all developers

### Local Development (Alternative)

```bash
# Install dependencies
npm install

# Start development server (background)
npm run dev &

# Seed sample data (required for testing)
npm run seed
```

## Key Features

### Multitenancy Architecture

- Multiple directory sites from a single codebase
- Domain-based routing and site identification
- Isolated content per site with shared infrastructure

### Admin Dashboard

- Comprehensive site management
- Modular, component-based UI architecture
- Mobile-responsive design with accessibility support
- Hierarchical category management

### Component Architecture

The platform uses a modular component structure:

```
components/admin/
├── sites/          # Site management
├── categories/     # Category management
├── listings/       # Listing management
├── dashboard/      # Admin dashboard
├── auth/           # Authentication
├── layout/         # Admin layout
└── utils/          # Shared utilities
```

### Data Collection

The Python scraper in `/python` provides:

```bash
# Install dependencies
cd python
pip install -r requirements.txt

# Run scraper with AI analysis
python run_scraper.py --count 10 --categories "hiking gear"
```

Data can be saved via:
- **FileEndpointSaver**: Local JSON storage
- **APIEndpointSaver**: Direct API integration
- **EnhancedFileEndpointSaver**: Advanced file operations

## Testing

```bash
# Run all tests with auto-seeding
npm run test:all-with-seed

# Component tests
npm test -- -t "ComponentName"

# Domain and multitenancy tests
npm run test:domain
npm run test:multitenancy

# Docker tests (complete environment)
npm run test:docker
```

The test suite covers:
- Component functionality and accessibility
- Domain resolution and multi-site isolation
- API endpoints and data management
- End-to-end user workflows

## Development Guidelines

1. **Always Use Docker** for consistent environment
2. **Component Architecture**:
   - Small, focused components with single responsibilities
   - Data fetching at the top level of server components
   - Props-based data flow (avoid prop drilling)
3. **CSS with Tailwind**:
   - Use `@import` instead of `@tailwind` in CSS files
   - Follow mobile-first responsive design
4. **Testing**:
   - Test behavior, not implementation
   - Use data-testid attributes for selection
   - Cover accessibility requirements
5. **Git Workflow**:
   - Feature branches with descriptive names
   - Pull requests with comprehensive testing
   - CI verification before merging

## Configuration

### Environment Variables

```
REDIS_URL=redis://localhost:6379
AUTH_SECRET=your-auth-secret
```

### Local Domain Testing

Add to your hosts file:
```
127.0.0.1 fishinggearreviews.com
127.0.0.1 hikinggearreviews.com
127.0.0.1 fishing-gear.mydirectory.com
127.0.0.1 hiking-gear.mydirectory.com
```

Or use the `?hostname=` query parameter during development.

## Documentation

- [Docker Development](DOCKER-DEV.md)
- [Component Guidelines](docs/components.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [URL Utilities](docs/url-utilities.md)
- [Data Seeding](docs/seeding.md)
- [Tenant Security Guide](docs/TENANT_SECURITY_GUIDE.md)

## Troubleshooting

1. **Testing Issues**:
   - Always seed data first: `npm run seed`
   - Use convenience scripts: `npm run test:with-seed`
   - Add domain entries to hosts file or use `?hostname=` parameter

2. **CSS Issues**:
   - Use `@import` instead of `@tailwind` directives
   - Verify PostCSS configuration
   - Check Tailwind dependencies

3. **Next.js Errors**:
   - Move async operations to server components
   - Pre-process data before passing to client components
   - Avoid nested async operations

4. **Redis Connection**:
   - For local development, use in-memory fallback
   - For Docker, verify Redis container is running
   - Check connection string in environment variables