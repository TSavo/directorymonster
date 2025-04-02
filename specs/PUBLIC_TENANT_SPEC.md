# Public Tenant Implementation Specification

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

1. **Public Tenant Creation**
   - Create a special tenant with ID `public` (or similar identifier)
   - Configure with minimal settings and a default theme
   - Mark as a system tenant that cannot be deleted

2. **Automatic User Assignment**
   - On user registration/creation, automatically assign to the public tenant
   - Assign a default "Public Member" role with minimal permissions
   - Store this assignment using existing role/user assignment infrastructure

3. **Admin Tenant Assignment Interface**
   - Enhance admin panel to display users in the public tenant
   - Allow tenant admins to assign public tenant users to their tenant
   - Support role selection during tenant assignment

4. **Tenant Transition Flow**
   - Users remain in the public tenant even after assignment to other tenants
   - User login should direct to their primary tenant if assigned, or the public tenant if not
   - Users with multiple tenants should see a tenant selector

5. **Permission Structure**
   - Define a limited "Public Member" role with minimal permissions
   - Ensure public tenant data is appropriately isolated from other tenants

## Technical Implementation

### Data Model Extensions

No significant data model changes are required, as the current multi-tenant infrastructure supports the public tenant concept. The system will use:

- Existing `TenantConfig` structure for the public tenant
- Existing user-tenant membership and role assignment mechanisms
- Current permission and ACL structure

### New Components

1. **Public Tenant Service**
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
      */
     static async addUserToPublicTenant(userId: string): Promise<boolean>
     
     /**
      * Check if a user is only in the public tenant
      */
     static async isOnlyInPublicTenant(userId: string): Promise<boolean>
     
     /**
      * Get all users who are only in the public tenant
      */
     static async getPublicOnlyUsers(): Promise<string[]>
   }
   ```

2. **Auth Flow Modifications**
   - Update user registration to add users to public tenant
   - Modify login flow to handle public tenant users appropriately
   - Implement tenant selection UI for users with multiple tenants

3. **Admin Interface Enhancements**
   - Add a "Public Users" section in the admin tenant management UI
   - Implement user assignment flow from public to specific tenant
   - Create interfaces for managing the transition

### Integration Points

1. **User Registration/Creation**
   - After user creation, call `PublicTenantService.addUserToPublicTenant(userId)`

2. **Admin Panel**
   - Add UI to show `PublicTenantService.getPublicOnlyUsers()`
   - Implement assignment flow using existing `TenantMembershipService.addUserToTenant()`

3. **Authentication Flow**
   - Check user's tenant memberships during login
   - Redirect appropriately based on tenant assignments

## Implementation Phases

### Phase 1: Public Tenant Foundation
- Create the PublicTenantService
- Implement the public tenant creation
- Add automatic public tenant assignment on user creation

### Phase 2: Admin Interface
- Build the admin UI for viewing public tenant users
- Implement the tenant assignment flow
- Add role selection during assignment

### Phase 3: User Experience
- Enhance login flow to handle tenant selection
- Improve navigation between tenants
- Add UI indicators for current tenant context

## Security Considerations

1. **Tenant Isolation**
   - Maintain strict tenant isolation for data
   - Ensure public tenant users cannot access other tenant data

2. **Permission Boundaries**
   - Define strict permission boundaries for public tenant users
   - Prevent privilege escalation through tenant assignments

3. **Admin Controls**
   - Only users with appropriate permissions can assign users to tenants
   - Maintain audit logs for tenant assignment changes

## Acceptance Criteria

1. All new users are automatically assigned to the public tenant
2. Tenant admins can view users in the public tenant
3. Tenant admins can assign public users to their tenant with specific roles
4. Users with multiple tenant assignments can navigate between tenants
5. Tenant isolation is maintained for data security
6. The public tenant is protected from deletion or deactivation

## Future Considerations

1. **Tenant Invitations**
   - Implement email invitations for tenant assignments
   - Allow users to request tenant access

2. **Custom Public Tenant Experiences**
   - Allow customization of the public tenant experience
   - Support tenant-specific onboarding flows

3. **Tenant Assignment Approval Workflows**
   - Implement approval workflows for tenant assignments
   - Support multi-step verification for tenant access
