// auth-imports.test.tsx
// Test imports for both named and default export patterns

import React from 'react';
import { render } from '@testing-library/react';

// Test named imports
import { 
  AuthContainer, 
  FirstUserSetup,
  LogoutButton,
  PasswordResetForm,
  RoleGuard,
  SessionManager,
  ZKPLogin
} from '../auth';

// Test default imports
import AuthContainerDefault from '../auth/AuthContainer';
import FirstUserSetupDefault from '../auth/FirstUserSetup';
import LogoutButtonDefault from '../auth/LogoutButton';
import PasswordResetFormDefault from '../auth/PasswordResetForm';
import RoleGuardDefault from '../auth/RoleGuard';
import SessionManagerDefault from '../auth/SessionManager';
import ZKPLoginDefault from '../auth/ZKPLogin';

// Simple test components
describe('Auth Component Import Test', () => {
  it('renders both named and default imports correctly', () => {
    // This test only checks if imports work correctly
    // Actual rendering is not tested
    
    // Test named imports rendering
    expect(() => {
      const { container: namedImportsContainer } = render(
        <div>
          <AuthContainer>Named Import Test</AuthContainer>
          <SessionManager>
            <RoleGuard requiredRole="admin">
              <LogoutButton />
              <FirstUserSetup />
              <PasswordResetForm />
              <ZKPLogin />
            </RoleGuard>
          </SessionManager>
        </div>
      );
    }).not.toThrow();
    
    // Test default imports rendering
    expect(() => {
      const { container: defaultImportsContainer } = render(
        <div>
          <AuthContainerDefault>Default Import Test</AuthContainerDefault>
          <SessionManagerDefault>
            <RoleGuardDefault requiredRole="admin">
              <LogoutButtonDefault />
              <FirstUserSetupDefault />
              <PasswordResetFormDefault />
              <ZKPLoginDefault />
            </RoleGuardDefault>
          </SessionManagerDefault>
        </div>
      );
    }).not.toThrow();
  });
});
