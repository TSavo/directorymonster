# Submission API Specification

## Overview

The Submission API provides a controlled way for authenticated users to contribute content to the directory without requiring administrative access. It implements a workflow where users can submit content for review, and administrators can approve, reject, or request changes to submissions.

## Architecture

The DirectoryMonster API is organized into three distinct tiers:

1. **Public API** (`/api/*`): Read-only endpoints for public consumption of directory data
2. **Submission API** (`/api/submit/*`): Authenticated endpoints for content contribution
3. **Admin API** (`/api/admin/*`): Administrative endpoints for system management

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

### Listings Submission

- `POST /api/submit/listings`: Create a new listing submission
- `GET /api/submit/listings`: Retrieve user's listing submissions
- `GET /api/submit/listings/{submissionId}`: Get details of a specific submission
- `PUT /api/submit/listings/{submissionId}`: Update a pending submission
- `DELETE /api/submit/listings/{submissionId}`: Withdraw a submission

### Categories Submission

- `POST /api/submit/categories`: Submit a new category (if enabled)
- `GET /api/submit/categories`: Retrieve user's category submissions
- `GET /api/submit/categories/{submissionId}`: Get details of a specific category submission
- `PUT /api/submit/categories/{submissionId}`: Update a pending category submission
- `DELETE /api/submit/categories/{submissionId}`: Withdraw a category submission

## Security Model

The Submission API implements several security measures:

1. **Authentication**: All endpoints require valid JWT authentication
2. **Authorization**: Users can only manage their own submissions
3. **Validation**: All submitted content is validated and sanitized
4. **Rate Limiting**: Prevents abuse of the submission system
5. **Audit Logging**: All submission activities are logged for security purposes

## Implementation Guidelines

- Store submissions separately from approved content
- Implement proper tenant isolation for submissions
- Provide clear feedback mechanisms for users
- Implement notification systems for status changes
- Support partial updates to submissions
- Maintain audit trails of all submission activities
- Consider implementing spam detection for submissions

## Relationship to Other APIs

### Public API

- The Public API serves read-only content to end users
- Approved submissions become visible through the Public API
- The Public API has no knowledge of pending submissions

### Admin API

- Administrators review submissions through the Admin API
- The Admin API provides comprehensive submission management
- Administrators can see all submissions across users
- The Admin API implements the approval workflow

## Benefits of the Submission API

1. **Quality Control**: Ensures all content meets quality standards before publication
2. **User Contribution**: Allows users to contribute without administrative access
3. **Workflow Management**: Provides a structured process for content review
4. **Security**: Maintains system integrity while enabling contribution
5. **Feedback Loop**: Enables communication between administrators and contributors

By implementing this three-tier architecture, DirectoryMonster provides a secure, scalable, and user-friendly platform for directory management.