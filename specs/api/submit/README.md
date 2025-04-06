# Submission API Specification

## Overview

The Submission API provides a controlled way for authenticated users to contribute content to the directory without requiring administrative access. It implements a workflow where users can submit content for review, and administrators can approve, reject, or request changes to submissions.

## Architecture

The DirectoryMonster API is organized into two main tiers with site-specific submission endpoints:

1. **Public API** (`/api/sites/*`):
   - Read-only endpoints for public consumption of directory data
   - Includes authenticated submission endpoints at `/api/sites/[siteSlug]/submissions`
   - Requires authentication and ACL permissions for submission operations

2. **Admin API** (`/api/admin/*`):
   - Administrative endpoints for system management
   - Includes submission review and management at `/api/admin/submissions`

This separation provides clear boundaries between different types of operations and security models.

## Key Concepts

### Submission Workflow

1. **Creation**: Users create submissions through the Submission API
2. **Review**: Administrators review submissions through the Admin API
3. **Feedback**: Administrators can provide feedback requesting changes
4. **Updates**: Users can update pending submissions based on feedback
5. **Approval/Rejection**: Administrators make final decisions on submissions
6. **Publication**: Approved submissions become visible through the Public API

### Submission States

- **Pending**: Awaiting administrative review
- **In Review**: Currently being reviewed by an administrator
- **Changes Requested**: Administrator has requested changes
- **Approved**: Submission has been approved and published
- **Rejected**: Submission has been rejected
- **Withdrawn**: User has withdrawn the submission

## Endpoints

### User Submission Endpoints (Public API with Authentication)

- `POST /api/sites/[siteSlug]/submissions`: Create a new submission for a specific site
- `GET /api/sites/[siteSlug]/submissions`: Retrieve user's own submissions for a specific site
- `GET /api/sites/[siteSlug]/submissions/[submissionId]`: Get details of a specific submission
- `PUT /api/sites/[siteSlug]/submissions/[submissionId]`: Update a pending submission
- `DELETE /api/sites/[siteSlug]/submissions/[submissionId]`: Withdraw a submission

### Admin Submission Management (Admin API)

- `GET /api/admin/submissions`: List all submissions (with filtering options)
- `GET /api/admin/submissions/[id]`: Get details of a specific submission
- `POST /api/admin/submissions/[id]/approve`: Approve a submission
- `POST /api/admin/submissions/[id]/reject`: Reject a submission with feedback
- `POST /api/admin/submissions/[id]/request-changes`: Request changes to a submission

## Security Model

The Submission API implements several security measures:

1. **Authentication**: All submission endpoints require valid JWT authentication
2. **ACL Checks**: Access control is enforced at two levels:
   - **Site Level**: Sites can be configured to disable submissions entirely
   - **User Level**: Specific users can be blocked from submitting content
3. **Authorization**: Users can only manage their own submissions
4. **Validation**: All submitted content is validated and sanitized
5. **Rate Limiting**: Prevents abuse of the submission system
6. **Audit Logging**: All submission activities are logged for security purposes

## Implementation Guidelines

### User-Facing Submission Endpoints

- Implement site-specific submission endpoints at `/api/sites/[siteSlug]/submissions`
- Use `withAuthentication` middleware to ensure users are authenticated
- Implement ACL checks to verify user permissions at both site and user levels
- Allow users to manage only their own submissions
- Provide clear feedback and status information

### Admin Submission Management

- Use `withSecureTenantPermission` middleware for admin endpoints
- Implement proper tenant and site isolation for submissions
- Store submissions separately from approved content using Redis-based persistence
- Use the unified Listing type definition from `src/types/listing.ts`
- Implement transformation from Submission to Listing upon approval

### General Guidelines

- Provide clear feedback mechanisms for users
- Implement notification systems for status changes
- Support partial updates to submissions
- Maintain audit trails of all submission activities
- Consider implementing spam detection for submissions

## Relationship to Other APIs

### Public API

- The Public API (`/api/sites/*`) serves read-only content to end users
- Approved submissions become visible through the Public API as listings
- The Public API includes authenticated submission endpoints for users
- These endpoints are secured with authentication and ACL checks

### Admin API

- The Admin API (`/api/admin/*`) provides management capabilities for administrators
- Administrators use the Admin API to review, approve, or reject submissions
- The Admin API has full visibility into all submissions across all sites
- Admin endpoints are secured with the `withSecureTenantPermission` middleware

## Benefits of the Submission API

1. **Quality Control**: Ensures all content meets quality standards before publication
2. **User Contribution**: Allows users to contribute without administrative access
3. **Workflow Management**: Provides a structured process for content review
4. **Security**: Maintains system integrity while enabling contribution
5. **Feedback Loop**: Enables communication between administrators and contributors

By implementing this three-tier architecture, DirectoryMonster provides a secure, scalable, and user-friendly platform for directory management.