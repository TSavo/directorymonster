# Public Tenant Implementation Specification (Revised)

## Overview

This specification outlines the implementation of a "Public Tenant" system in DirectoryMonster to support the user onboarding flow where users initially join without a specific tenant assignment and later get assigned to tenants through the admin panel.

## Current System

Currently, DirectoryMonster implements a multi-tenant architecture where:
- Each user can be a member of multiple tenants
- Users have different roles within each tenant
- Roles define permissions through ACL entries
- The system enforces tenant isolation for data security

## Proposed Enhancement: Public Tenant

### Concept

The "Public Tenant" will serve as a default landing space for all new users before they are explicitly assigned to specific tenants. This provides a clear path for user onboarding and tenant assignment.

### Core Requirements

1. **Public Tenant Creation and Management**
   - Create a special tenant with ID `public` (or similar identifier)
   - Configure with minimal settings and a default theme
   - Mark as a system tenant that cannot be deleted

2. **Automatic User Assignment**
   - On user registration/creation, automatically assign to the public tenant
   - Assign a default "Public Member" role with minimal permissions
   - Use the existing TenantMembershipService for the assignment

3. **Admin Tenant Assignment Interface**
   - Display users in the public tenant via the admin panel
   - Allow tenant admins to assign users to additional tenants
   - Support role selection during tenant assignment

4. **Clear Separation of Responsibilities**
   - PublicTenantService: Responsible ONLY for ensuring public tenant exists and configuring it
   - TenantMembershipService: Manages ALL user-tenant relationships, including public tenant
   - No special "transfer" operations - use existing add/remove methods

## Technical Implementation

### Core Components

1. **PublicTenantService**
   ```typescript
   // New service file: src/lib/tenant/public-tenant-service.ts
   export class PublicTenantService {
     static PUBLIC_TENANT_ID = 'public';
     static PUBLIC_MEMBER_ROLE_ID = 'public-member';
     
     /**
      * Ensure the public tenant exists, creating it if necessary
      */
     static async ensurePublicTenant(): Promise<TenantConfig>
     
     /**
      * Add a user to the public tenant with the default role
      * Delegates to TenantMembershipService
      */
     static async addUserToPublicTenant(userId: string): Promise<boolean>
   }
   ```

2. **Integration Points**
   - User Registration: Call `PublicTenantService.addUserToPublicTenant(userId)` after user creation
   - Admin Panel: Use existing TenantMembershipService methods directly for tenant assignments

## Implementation Phases

### Phase 1: Public Tenant Foundation
- Create the PublicTenantService
- Implement the public tenant creation
- Add automatic public tenant assignment on user creation

### Phase 2: Admin Interface
- Use existing TenantMembershipService for all tenant management operations
- Implement UI to display users in the public tenant
- Use standard tenant assignment workflows for adding users to other tenants

## Acceptance Criteria

1. The public tenant exists with the correct configuration
2. All new users are automatically added to the public tenant
3. Tenant admins can view users in the public tenant
4. Tenant admins can assign public users to their tenant with specific roles
5. Data isolation is maintained for security

## Implementation Guidelines

1. **Keep It Simple**
   - Reuse existing tenant membership infrastructure
   - Avoid creating new "transfer" or special operations
   - Minimize duplication of logic

2. **Clear Responsibility Boundaries**
   - PublicTenantService: Only responsible for public tenant existence and configuration
   - TenantMembershipService: Handles all user-tenant memberships
   - RoleService: Manages roles and permissions

3. **Essential vs. Nice-to-Have Features**
   - Essential: Public tenant creation and automatic user assignment
   - Nice-to-Have: Special UI for managing public-only users 
