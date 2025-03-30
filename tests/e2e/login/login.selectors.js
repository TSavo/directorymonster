/**
 * @file Login page selectors
 * @description Centralized selectors for login page E2E tests
 */

const LoginSelectors = {
  // Main login page elements
  page: '[data-testid="login-page"]',
  formContainer: '[data-testid="login-form-container"]',
  form: '[data-testid="login-form"]',
  heading: '[data-testid="login-heading"]',
  subheading: '[data-testid="login-subheading"]',
  
  // Form inputs and buttons
  inputs: {
    username: '#username, [data-testid="username-input"]',
    password: '#password, [data-testid="password-input"]',
    rememberMe: '#remember-me, [data-testid="remember-me-checkbox"]'
  },
  
  // Buttons
  buttons: {
    submit: 'button[type="submit"], [data-testid="login-submit-button"]',
    resetPassword: '[data-testid="reset-password-link"], a[href*="reset-password"]',
    forgotPassword: '[data-testid="forgot-password-link"], a[href*="forgot-password"]'
  },
  
  // Error messages
  errors: {
    formError: '[data-testid="form-error"], div.mb-4.p-3.bg-red-100, div[role="alert"]',
    usernameError: '#username-error, [data-testid="username-error"], .text-red-600',
    passwordError: '#password-error, [data-testid="password-error"], .text-red-600'
  },
  
  // Loading states
  loading: {
    spinner: '[data-testid="loading-spinner"]',
    overlay: '[data-testid="loading-overlay"]'
  },
  
  // Success indicators
  success: {
    notification: '[data-testid="success-notification"]',
    redirectUrl: '/admin'
  },
  
  // Fallback selectors (when data-testid isn't available)
  fallback: {
    form: 'form',
    username: 'input[type="text"], input[id="username"], input[name="username"]',
    password: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    errors: '.text-red-600, .text-red-700, .bg-red-100, [role="alert"], .error, div.mb-4.p-3.bg-red-100',
    loginText: 'h1, h2, h3',
    adminDashboard: '.admin-header, .dashboard, [data-testid="admin-dashboard"]'
  }
};

module.exports = LoginSelectors;
