# Seeding DirectoryMonster with Data

This guide explains how to seed DirectoryMonster with sample data for development and testing.

## API-based Seeding

DirectoryMonster uses API-based seeding exclusively to ensure all data follows proper validation rules and business logic.

```bash
# Basic API seeding (local development)
npm run data:seed

# Using Docker
npm run data:seed:docker
```

## How API Seeding Works

API seeding follows this process:

1. Creates site(s) via the `/api/sites` endpoint
2. Creates categories via the `/api/sites/[siteSlug]/categories` endpoint
3. Creates listings via the `/api/sites/[siteSlug]/listings` endpoint
4. Properly handles error cases like existing records

The API seeding scripts handle dependencies and relationships automatically, ensuring data consistency.

## Benefits of API Seeding

- Uses the actual API endpoints to create data
- Validates all data through API validation rules
- Creates proper relationships between entities
- Better reflects how data will be created in production
- Ensures proper indexing and other side effects
- Checks for and handles existing data conflicts

## Testing with Seeded Data

You can run tests with seeded data using these commands:

```bash
# Run tests with API seeding
npm run test:with:seed

# Run tests with API seeding (Docker)
npm run test:with:seed:docker

# Run all tests
npm run test

# Run all tests in Docker
npm run test:docker
```

## Data Structure

The seed data includes:

- Two sites: "Fishing Gear Reviews" and "Hiking Gear Directory"
- Multiple categories for each site
- Sample listings with detailed product information
- Search indexes for the listings

## Adding New Seed Data

To add new sample data:

1. Edit `scripts/api-seed-data.ts` to add new sites, categories, or listings
2. Follow the existing patterns for creating related objects
3. Run the seeding command to verify your changes