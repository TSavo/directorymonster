# Admin API Specification

## Overview

The Admin API provides comprehensive management capabilities for administrators. It enables full control over the DirectoryMonster platform, including user management, content management, submission review, and system configuration.

## Architecture

The DirectoryMonster API is organized into three distinct tiers:

1. **Public API** (`/api/*`): Read-only endpoints for public consumption of directory data
2. **Submission API** (`/api/submit/*`): Authenticated endpoints for content contribution
3. **Admin API** (`/api/admin/*`): Administrative endpoints for system management

The Admin API is the most powerful and requires the highest level of security and permission controls.

## Key Concepts

### Tenant Isolation

The Admin API implements strict tenant isolation:

1. All requests require a tenant context header (`X-Tenant-ID`)
2. Administrators can only access resources within their tenant scope
3. Super admins can access resources across tenants
4. All operations maintain tenant boundaries

### Role-Based Access Control

The Admin API implements a sophisticated role-based access control system:

1. Different admin roles have different capabilities
2. Permissions are granular and resource-specific
3. Permission checks occur at multiple layers
4. Cross-tenant operations require special permissions

### Audit Logging

All administrative operations are logged for security and compliance:

1. User actions are recorded with timestamps and context
2. Sensitive operations require additional verification
3. Audit logs are available for review by authorized administrators
4. Security events trigger alerts

## Endpoints

### User Management

- `GET /api/admin/users`: List all users
- `POST /api/admin/users`: Create a new user
- `GET /api/admin/users/{id}`: Get user details
- `PUT /api/admin/users/{id}`: Update a user
- `DELETE /api/admin/users/{id}`: Delete a user
- `POST /api/admin/users/{id}/reset-password`: Reset user password

### Role Management

- `GET /api/admin/roles`: List all roles
- `POST /api/admin/roles`: Create a new role
- `GET /api/admin/roles/{id}`: Get role details
- `PUT /api/admin/roles/{id}`: Update a role
- `DELETE /api/admin/roles/{id}`: Delete a role
- `POST /api/admin/roles/{id}/assign`: Assign role to user

### Site Management

- `GET /api/admin/sites`: List all sites
- `POST /api/admin/sites`: Create a new site
- `GET /api/admin/sites/{id}`: Get site details
- `PUT /api/admin/sites/{id}`: Update a site
- `DELETE /api/admin/sites/{id}`: Delete a site

### Category Management

- `GET /api/admin/categories`: List all categories
- `POST /api/admin/categories`: Create a new category
- `GET /api/admin/categories/{id}`: Get category details
- `PUT /api/admin/categories/{id}`: Update a category
- `DELETE /api/admin/categories/{id}`: Delete a category

### Listing Management

- `GET /api/admin/listings`: List all listings
- `POST /api/admin/listings`: Create a new listing
- `GET /api/admin/listings/{id}`: Get listing details
- `PUT /api/admin/listings/{id}`: Update a listing
- `DELETE /api/admin/listings/{id}`: Delete a listing

### Submission Management

- `GET /api/admin/submissions`: List all submissions
- `GET /api/admin/submissions/{id}`: Get submission details
- `PUT /api/admin/submissions/{id}/approve`: Approve a submission
- `PUT /api/admin/submissions/{id}/reject`: Reject a submission
- `PUT /api/admin/submissions/{id}/feedback`: Provide feedback on a submission

### Dashboard and Analytics

- `GET /api/admin/dashboard/stats`: Get dashboard statistics
- `GET /api/admin/dashboard/activity`: Get recent activity
- `GET /api/admin/dashboard/submissions`: Get submission statistics

### Audit and Security

- `GET /api/admin/audit`: Get audit logs
- `GET /api/admin/audit/security`: Get security events
- `POST /api/admin/audit/export`: Export audit logs

## Security Model

The Admin API implements several security measures:

1. **Authentication**: All endpoints require valid JWT authentication with admin privileges
2. **Authorization**: Granular permission checks for all operations
3. **Tenant Isolation**: Strict boundaries between tenant data
4. **Input Validation**: Comprehensive validation of all input data
5. **Audit Logging**: Detailed logging of all administrative actions
6. **Rate Limiting**: Protection against brute force and DoS attacks

## Implementation Guidelines

- Implement proper tenant isolation for all operations
- Use Redis transactions for data consistency
- Apply tenant-specific key prefixing for all data access
- Implement comprehensive permission checks at multiple layers
- Log all administrative actions for audit purposes
- Sanitize all input data to prevent injection attacks
- Implement proper error handling with meaningful messages
- Use consistent response formats across all endpoints

## Relationship to Other APIs

### Public API

- The Admin API can manage what content is visible through the Public API
- Administrative changes affect what users see in the Public API
- The Admin API has full control over public content

### Submission API

- The Admin API reviews and manages submissions from the Submission API
- Administrators approve or reject user submissions
- The Admin API provides feedback to users on their submissions

## Benefits of the Admin API

1. **Comprehensive Control**: Full management of all system aspects
2. **Security**: Proper isolation and permission controls
3. **Audit Trail**: Complete visibility into administrative actions
4. **Workflow Management**: Structured processes for content review
5. **Multi-Tenant Support**: Proper isolation between tenant data

By implementing this three-tier architecture, DirectoryMonster provides a secure, scalable, and manageable platform for directory management.