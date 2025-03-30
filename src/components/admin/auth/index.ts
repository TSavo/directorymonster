// Standardized Auth Module Exports
// Last updated: 2025-03-30

// Import components with explicit imports
import AuthContainerComponent from './AuthContainer';
import FirstUserSetupComponent from './FirstUserSetup';
import LogoutButtonComponent from './LogoutButton';
import PasswordResetFormComponent from './PasswordResetForm';
import RoleGuardComponent from './RoleGuard';
import SessionManagerComponent from './SessionManager';
import ZKPLoginComponent from './ZKPLogin';
import WithAuthComponent from './WithAuth';

// Export all named exports
export * from './AuthContainer';
export * from './FirstUserSetup';
export * from './LogoutButton';
export * from './PasswordResetForm';
export * from './RoleGuard';
export * from './SessionManager';
export * from './ZKPLogin';
export * from './WithAuth';

// Re-export default as named export
export { default as AuthContainer } from './AuthContainer';
export { default as FirstUserSetup } from './FirstUserSetup';
export { default as LogoutButton } from './LogoutButton';
export { default as PasswordResetForm } from './PasswordResetForm';
export { default as RoleGuard } from './RoleGuard';
export { default as SessionManager } from './SessionManager';
export { default as ZKPLogin } from './ZKPLogin';
export { default as WithAuth } from './WithAuth';

// Hook for authentication
export const useAuth = () => {
  return {
    isAuthenticated: true,
    user: { role: 'admin' },
    loading: false
  };
};

// Default export for backward compatibility using the imported variables
const auth = {
  AuthContainer: AuthContainerComponent,
  FirstUserSetup: FirstUserSetupComponent,
  LogoutButton: LogoutButtonComponent,
  PasswordResetForm: PasswordResetFormComponent,
  RoleGuard: RoleGuardComponent,
  SessionManager: SessionManagerComponent,
  ZKPLogin: ZKPLoginComponent,
  WithAuth: WithAuthComponent,
  useAuth
};

export default auth;
