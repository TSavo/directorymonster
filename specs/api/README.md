# DirectoryMonster API Documentation

This document outlines the API architecture and endpoints available for programmatic interaction with the DirectoryMonster platform.

## API Architecture

DirectoryMonster implements a two-tier API architecture with site-specific submission endpoints:

1. **Public API** (`/api/sites/*`):
   - Read-only endpoints for public consumption of directory data
   - Includes authenticated submission endpoints at `/api/sites/[siteSlug]/submissions`
   - Requires authentication and ACL permissions for submission operations

2. **Admin API** (`/api/admin/*`):
   - Administrative endpoints for system management
   - Includes submission review and management at `/api/admin/submissions`

This architecture provides clear boundaries between different types of operations and security models while maintaining a consistent approach to site-specific operations.

## Public API

The Public API primarily provides read-only access to published directory content. Most endpoints do not require authentication and are designed for high-performance content delivery.

### Authentication

Most Public API endpoints do not require authentication. However, the submission endpoints (`/api/sites/[siteSlug]/submissions/*`) require authentication and ACL permissions.

### Caching

Public API responses include appropriate cache headers for CDN compatibility and improved performance.

### Rate Limiting

Public API endpoints implement rate limiting to prevent abuse. Requests exceeding the rate limit will receive a 429 Too Many Requests response.

## Submission API

The Submission API allows authenticated users to submit content for review. These endpoints require authentication and implement a workflow where submissions are reviewed by administrators before publication.

### Authentication

All Submission API requests require a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Workflow

1. Users submit content through the Submission API
2. Administrators review submissions through the Admin API
3. Approved submissions become visible through the Public API

## Admin API

The Admin API provides comprehensive management capabilities for administrators. These endpoints require authentication with administrative privileges.

### Authentication

All Admin API requests require a JWT token with administrative permissions. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

### Tenant Context

Admin API requests require a tenant context header:

```
X-Tenant-ID: YOUR_TENANT_ID
```

## API Endpoints

### Public API

#### Sites

- `GET /api/sites`: List all published sites
- `GET /api/sites/{slug}`: Get details of a specific site

#### Categories

- `GET /api/sites/{siteSlug}/categories`: List all categories for a site
- `GET /api/sites/{siteSlug}/categories/{slug}`: Get details of a specific category

#### Listings

- `GET /api/sites/{siteSlug}/listings`: List all listings for a site
- `GET /api/sites/{siteSlug}/listings/{slug}`: Get details of a specific listing
- `GET /api/sites/{siteSlug}/categories/{categorySlug}/listings`: List listings in a category

#### Search

- `GET /api/search`: Search across all sites and listings

### User Submission Endpoints (Public API with Authentication)

#### Site-Specific Submissions

- `POST /api/sites/{siteSlug}/submissions`: Create a new submission for a specific site
- `GET /api/sites/{siteSlug}/submissions`: Retrieve user's own submissions for a specific site
- `GET /api/sites/{siteSlug}/submissions/{submissionId}`: Get details of a specific submission
- `PUT /api/sites/{siteSlug}/submissions/{submissionId}`: Update a pending submission
- `DELETE /api/sites/{siteSlug}/submissions/{submissionId}`: Withdraw a submission

### Admin API

#### User Management

- `GET /api/admin/users`: List all users
- `POST /api/admin/users`: Create a new user
- `GET /api/admin/users/{id}`: Get user details
- `PUT /api/admin/users/{id}`: Update a user
- `DELETE /api/admin/users/{id}`: Delete a user

#### Site Management

- `GET /api/admin/sites`: List all sites
- `POST /api/admin/sites`: Create a new site
- `GET /api/admin/sites/{id}`: Get site details
- `PUT /api/admin/sites/{id}`: Update a site
- `DELETE /api/admin/sites/{id}`: Delete a site

#### Content Management

- `GET /api/admin/categories`: List all categories
- `POST /api/admin/categories`: Create a new category
- `GET /api/admin/listings`: List all listings
- `POST /api/admin/listings`: Create a new listing

#### Submission Management

- `GET /api/admin/submissions`: List all submissions (with filtering options)
- `GET /api/admin/submissions/{id}`: Get details of a specific submission
- `POST /api/admin/submissions/{id}/approve`: Approve a submission
- `POST /api/admin/submissions/{id}/reject`: Reject a submission with feedback
- `POST /api/admin/submissions/{id}/request-changes`: Request changes to a submission

## Detailed Documentation

For detailed specifications of each endpoint, refer to the individual API documentation files in the respective directories:

- [Public API Documentation](./README.md)
- [User Submission Documentation](./submit/README.md)
- [Admin API Documentation](./admin/README.md)