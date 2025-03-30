// Standardized Auth Module Exports
// Last updated: 2025-03-29

// Export all named exports
export * from './AuthContainer';
export * from './FirstUserSetup';
export * from './LogoutButton';
export * from './PasswordResetForm';
export * from './RoleGuard';
export * from './SessionManager';
export * from './ZKPLogin';

// Re-export default as named export
export { default as AuthContainer } from './AuthContainer';
export { default as FirstUserSetup } from './FirstUserSetup';
export { default as LogoutButton } from './LogoutButton';
export { default as PasswordResetForm } from './PasswordResetForm';
export { default as RoleGuard } from './RoleGuard';
export { default as SessionManager } from './SessionManager';
export { default as ZKPLogin } from './ZKPLogin';

// Hook for authentication
export const useAuth = () => {
  return {
    isAuthenticated: true,
    user: { role: 'admin' },
    loading: false
  };
};

// Default export for backward compatibility
export default {
  AuthContainer,
  FirstUserSetup,
  LogoutButton,
  PasswordResetForm,
  RoleGuard,
  SessionManager,
  ZKPLogin,
  useAuth
};
