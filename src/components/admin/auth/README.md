# Zero-Knowledge Proof Authentication Components

This directory contains components for implementing Zero-Knowledge Proof (ZKP) authentication in DirectoryMonster.

## Components

### ZKPLogin.tsx

A login form component that uses zero-knowledge proofs for secure authentication without sending passwords to the server.

```jsx
<ZKPLogin onSuccess={handleLoginSuccess} redirectPath="/admin/dashboard" />
```

**Props:**
- `onSuccess`: Optional callback when login succeeds
- `redirectPath`: Optional path to redirect after successful login (defaults to "/admin")

### SessionManager.tsx

A component that manages authentication state and token refreshing.

```jsx
<SessionManager redirectToLogin={true}>
  <AdminDashboard />
</SessionManager>
```

**Props:**
- `children`: React nodes to render when authenticated
- `redirectToLogin`: Whether to redirect to login page if not authenticated
- `loginPath`: Path to the login page (defaults to "/login")

### RoleGuard.tsx

A component that only renders children if user has the required role.

```jsx
<RoleGuard requiredRole="admin">
  <AdminSettings />
</RoleGuard>
```

**Props:**
- `children`: React nodes to render when authorized
- `requiredRole`: Role required to access the content
- `fallback`: Optional component to render when unauthorized

### LogoutButton.tsx

A button component that logs the user out.

```jsx
<LogoutButton redirect="/login" className="btn-danger" />
```

**Props:**
- `redirect`: Path to redirect after logout
- Other button props (className, style, etc.)

### PasswordResetForm.tsx

Form for password reset requests and confirmation.

```jsx
<PasswordResetForm mode="request" />
```

**Props:**
- `mode`: Either "request" or "confirm"
- `token`: Required token for "confirm" mode

## Authentication Context

The `useAuth` hook provides access to authentication state:

```jsx
const { user, isAuthenticated, login, logout, canAccess } = useAuth();
```

**Returns:**
- `user`: Current user object (null if not authenticated)
- `isAuthenticated`: Boolean indicating authentication status
- `isRefreshing`: Boolean indicating if token refresh is in progress
- `login(token)`: Function to set authentication with a token
- `logout()`: Function to log out
- `canAccess(role)`: Function to check if user has specific role

## Zero-Knowledge Proof Implementation

Authentication uses the adapter pattern to abstract ZKP operations:

1. `ZKPAdapter` interface defines operations for ZKP generation and verification
2. `SnarkJSAdapter` concrete implementation uses SnarkJS library
3. Adapters handle salt generation, proof generation, and verification

See the `/lib/zkp` directory for adapter implementation details.

## Security Considerations

- Passwords never leave the client
- CSRF protection is built into all authentication endpoints
- Rate limiting is implemented for failed login attempts
- Tokens are automatically refreshed before expiration
- Role-based authorization is enforced at both client and server
- Password salts are properly managed for security

## Testing

For testing guidelines, see `docs/auth-testing.md`.
