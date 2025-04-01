# DirectoryMonster SSO Integration Specification

## 1. Overview

This specification outlines the implementation plan to enhance DirectoryMonster's authentication system by adding Single Sign-On (SSO) capabilities that work alongside the existing username/password authentication. This will allow users to authenticate using external identity providers like Gmail, GitHub, Facebook, or other OAuth2 providers while maintaining compatibility with existing user accounts.

## 2. Goals and Requirements

### 2.1 Primary Goals
- Enable users to sign in using Gmail, GitHub, and Facebook accounts
- Link existing DirectoryMonster accounts with SSO providers
- Maintain strict tenant isolation during SSO authentication
- Preserve existing RBAC permissions and ACL infrastructure
- Follow Test-Driven Development practices for implementation

### 2.2 Technical Requirements
- OAuth 2.0 integration with multiple identity providers
- Security measures to prevent cross-tenant access during SSO
- Atomic account linking to prevent security vulnerabilities
- Audit logging for all SSO-related activities

## 3. Architecture

### 3.1 SSO Provider Interface

```typescript
// An interface that all SSO providers must implement
interface SSOProvider {
  id: string;                 // Unique identifier for the provider (e.g., 'google', 'github', 'facebook')
  name: string;               // Display name (e.g., 'Google', 'GitHub', 'Facebook')
  icon: string;               // Icon reference for the UI
  
  // Initialize the provider with configuration
  initialize(config: ProviderConfig): Promise<void>;
  
  // Start the authentication flow
  beginAuthentication(redirectUrl: string): Promise<string>;
  
  // Complete authentication and return user info
  completeAuthentication(code: string): Promise<SSOUserInfo>;
}

// User information returned from SSO providers
interface SSOUserInfo {
  providerId: string;         // The identity provider's identifier
  providerUserId: string;     // User ID from the provider
  email: string;              // User's email address
  name?: string;              // User's display name (optional)
  avatarUrl?: string;         // User's avatar URL (optional)
}
```

### 3.2 SSO-User Linking Model

```typescript
// Stored in the database or Redis to link SSO accounts with DirectoryMonster users
interface SSOUserLink {
  userId: string;             // DirectoryMonster user ID
  providerId: string;         // SSO provider ID (e.g., 'google', 'github', 'facebook')
  providerUserId: string;     // User ID from the provider
  email: string;              // User's email associated with the provider
  createdAt: number;          // Timestamp of when the link was created
  lastLoginAt: number;        // Timestamp of last login via this method
}
```

### 3.3 Enhanced ACL Integration

Extend the existing ACL system to recognize SSO authentications:

```typescript
// Extended to track authentication method
interface AuditLogEntry {
  // Existing fields
  userId: string;
  action: string;
  resource: Resource;
  timestamp: number;
  
  // New fields
  authMethod: 'password' | 'sso';
  ssoProvider?: string;       // Only present when authMethod is 'sso'
}
```

## 4. Implementation Plan

### 4.1 Database Schema Updates

1. Create a new `sso_user_links` table/collection:
   - `userId` (string): DirectoryMonster user ID
   - `providerId` (string): SSO provider ID
   - `providerUserId` (string): User ID from the provider
   - `email` (string): User's email
   - `createdAt` (number): Timestamp
   - `lastLoginAt` (number): Timestamp

2. Create Redis key conventions for SSO links:
   - `sso:provider:{providerId}:user:{providerUserId}` → DirectoryMonster user ID
   - `user:{userId}:sso:providers` → Set of linked provider IDs

### 4.2 API Endpoints

Create the following API endpoints:

1. **Initiate SSO Authentication**
   - `POST /api/auth/sso/{providerId}/begin`
   - Returns redirect URL to provider's authorization page

2. **Complete SSO Authentication**
   - `GET /api/auth/sso/{providerId}/callback`
   - Handles the OAuth callback
   - Creates or retrieves user account
   - Issues JWT and sets session cookies
   - Redirects to the appropriate page

3. **Link SSO Provider to Existing Account**
   - `POST /api/auth/sso/{providerId}/link`
   - Requires existing authenticated session
   - Links the account to the SSO provider

4. **Unlink SSO Provider**
   - `POST /api/auth/sso/{providerId}/unlink`
   - Removes the link between user and SSO provider

### 4.3 Provider Implementations

Create implementations for each provider:

1. **Google SSO Provider**:
   - Use Google OAuth 2.0 API
   - Request email, profile scope

2. **GitHub SSO Provider**:
   - Use GitHub OAuth 2.0 API
   - Request user:email scope

3. **Facebook SSO Provider**:
   - Use Facebook OAuth 2.0 API
   - Request email, public_profile scopes
   - Handle Graph API integration for user data

### 4.4 UI Components

1. **SSO Button Component**:
   - Displays provider logo and name
   - Handles onClick to initiate SSO flow
   - Includes styling variants for Google, GitHub, and Facebook branding

2. **Account Linking Page**:
   - Shows currently linked providers
   - Provides UI to link/unlink providers
   - Displays warnings about account security

3. **Enhanced Login Page**:
   - Add SSO provider buttons above or below the password form
   - Clear visual separation between methods
   - Informative messages about SSO process

## 5. Authentication Flow

### 5.1 New User SSO Registration Flow

1. User clicks the SSO provider button (e.g., "Sign in with Facebook")
2. System redirects to provider's authentication page
3. User authenticates with the provider
4. Provider redirects back with authorization code
5. System verifies the code and receives user information
6. System checks if this SSO account is already linked to a user
   - If not linked, creates a new user account with default permissions
   - Associates the SSO provider account with the new user
7. System creates appropriate ACL entries for the user
8. System redirects to the appropriate landing page based on permissions

### 5.2 Existing User SSO Login Flow

1. User clicks the SSO provider button
2. Steps 2-5 from above
3. System identifies the existing user linked to this SSO account
4. System loads the user's ACL and permissions
5. System redirects to the appropriate landing page based on permissions

### 5.3 Account Linking Flow (logged in user)

1. Authenticated user navigates to account settings
2. User initiates linking to a new SSO provider
3. Steps 2-5 from the registration flow
4. System links the SSO provider to the user's existing account
5. System returns to account settings with success message

## 6. Tenant Security Considerations

Given DirectoryMonster's multi-tenant architecture, special attention must be paid to tenant isolation:

1. **Tenant Context Preservation**:
   - SSO callbacks must maintain tenant context (e.g., via state parameter in OAuth flow)
   - Redis keys for SSO links should be namespaced by tenant when appropriate

2. **Cross-Tenant Prevention**:
   - Prevent users from accessing resources across tenants using SSO credentials
   - Apply existing `detectCrossTenantAccess` checks to SSO authentication

3. **SSO-Specific Security Checks**:
   - Validate that email domains match allowed domains for the tenant (optional setting)
   - Implement rate limiting for SSO authentication attempts

## 7. Testing Strategy

Follow strict TDD principles:

1. **Unit Tests**:
   - Test each SSO provider implementation with mocked OAuth responses
   - Test user link creation and validation
   - Test security boundary checks for cross-tenant access

2. **Integration Tests**:
   - Test the full OAuth flow with mock identity providers
   - Test account linking/unlinking functionality
   - Test authentication persistence after SSO login

3. **End-to-End Tests**:
   - Test the complete user journey through the UI
   - Test SSO providers with real OAuth integration (sandboxed)

## 8. Implementation Phases

### Phase 1: Foundation
- Create SSO provider interface and base implementations
- Implement database schema changes
- Develop core authentication flows without UI

### Phase 2: Google Integration
- Implement Google OAuth provider
- Create basic UI components for Google SSO
- Test and validate Google authentication flow

### Phase 3: GitHub Integration
- Implement GitHub OAuth provider
- Extend UI components for GitHub SSO
- Test and validate GitHub authentication flow

### Phase 4: Facebook Integration
- Implement Facebook OAuth provider
- Create Facebook-styled SSO button
- Implement Graph API integration for user profile data
- Test and validate Facebook authentication flow

### Phase 5: Account Management
- Implement account linking/unlinking functionality
- Create account settings UI for managing SSO providers
- Implement security measures for account linking

### Phase 6: Testing and Security Hardening
- Comprehensive testing of all authentication flows
- Security review of implementations
- Performance testing for SSO operations

## 9. Configuration

Add the following environment variables:

```
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Facebook OAuth Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# General SSO Configuration
SSO_REDIRECT_URL=https://{hostname}/api/auth/sso/{provider}/callback
SSO_ENABLED_PROVIDERS=google,github,facebook
```

## 10. Migration Considerations

1. **No Breaking Changes**: Existing password authentication will continue to work
2. **Progressive Enhancement**: SSO options appear as additional login methods
3. **Account Merging**: Users can link their existing accounts to SSO providers

## 11. Future Enhancements

1. **Enterprise SSO**:
   - SAML support for enterprise identity providers
   - Azure AD / Microsoft account integration
   - Okta integration

2. **Advanced SSO Features**:
   - Tenant-specific SSO provider configuration
   - Domain-restricted SSO (only allow specific email domains)
   - Role mapping from SSO provider roles/groups

3. **Security Enhancements**:
   - Multi-factor authentication integration
   - Risk-based authentication decisions
   - Device fingerprinting for SSO logins

## 12. Facebook-Specific Considerations

1. **Data Privacy Compliance**:
   - Implement proper user consent workflow
   - Only request minimal required permissions
   - Provide clear privacy policy statements
   - Implement data deletion mechanism for GDPR compliance

2. **Token Handling**:
   - Securely store short-lived access tokens
   - Implement token refresh mechanism
   - Handle Facebook token revocation events

3. **User Experience**:
   - Consider implementing Facebook login with JavaScript SDK option for improved UX
   - Support both web and mobile authentication flows
   - Implement proper error handling for Facebook-specific errors