# Unified Authentication Component Specification

## Overview
This specification defines a unified authentication component that provides consistent login/logout functionality across all parts of the application, regardless of user role or context.

## Core Requirements

### 1. Universal Implementation
- Single component used in all headers (public site, admin dashboard, user portal)
- Consistent positioning in top-right corner of all headers
- Same visual design and behavior everywhere

### 2. Correct Terminology
- Use "Log In" (verb) for all action buttons and links
- Use "Log Out" (verb) for logout actions
- Use "Login" (noun) only when referring to the process itself
- Consistent terminology across all interfaces

### 3. Role-Agnostic Design
- Same component serves all user types (admin, regular user, etc.)
- Authentication flow identical regardless of user role
- Post-authentication UI adapts based on user permissions

### 4. State Management
- Unauthenticated state: Shows "Log In" button
- Authenticated state: Shows username and "Log Out" option
- Handles session expiration gracefully

## Component Interface

### Props
```typescript
interface AuthComponentProps {
  // Optional callback when authentication state changes
  onAuthChange?: (isAuthenticated: boolean) => void;
  
  // Optional custom styling
  className?: string;
  
  // Optional position override
  position?: 'left' | 'right' | 'center';
}
```

### Usage Example
```jsx
// In any header component
import { AuthComponent } from '@/components/auth';

function Header() {
  return (
    <header className="site-header">
      <div className="logo">...</div>
      <nav>...</nav>
      <AuthComponent />
    </header>
  );
}
```

## Visual Design

### Unauthenticated State
- "Log In" button with medium visual prominence
- Standard button styling (outline or filled depending on theme)
- Clear hover and focus states

### Authenticated State
- Username display with optional avatar
- Dropdown menu on click/tap
- "Log Out" option in dropdown
- Optional role indicator for admin users

## Behavior Specifications

### Login Flow
1. Click "Log In" button
2. Redirect to login page with `returnUrl` parameter
3. After successful authentication, redirect back to original location
4. Component automatically updates to show authenticated state

### Logout Flow
1. Click username to open dropdown
2. Select "Log Out" option
3. Perform logout action (clear token, etc.)
4. Update UI to show unauthenticated state
5. Remain on current page unless it requires authentication

### Error Handling
- Clear error messages for authentication failures
- Graceful handling of session timeouts
- Automatic redirect to login page when accessing protected content

## Accessibility Requirements
- WCAG AA compliance minimum
- Full keyboard navigation support
- Proper ARIA attributes
- Screen reader compatibility
- Sufficient color contrast

## Implementation Guidelines
1. Use React hooks for state management
2. Implement as a client component
3. Use context for sharing authentication state
4. Include comprehensive test coverage
5. Document all props and behaviors

## Success Criteria
- Component renders correctly in all application headers
- Authentication state is correctly reflected across the application
- Terminology is consistent and correct
- All user roles can authenticate using the same component
- Accessible to all users regardless of abilities
