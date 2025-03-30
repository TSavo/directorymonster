/**
 * @file First user selectors
 * @description Centralized selectors for first user setup E2E tests
 */

const FirstUserSelectors = {
  // Main setup page elements
  page: '[data-testid="first-user-setup-page"]',
  formContainer: '[data-testid="first-user-form-container"]',
  form: '[data-testid="first-user-form"]',
  heading: '[data-testid="first-user-heading"]',
  subheading: '[data-testid="first-user-subheading"]',
  
  // Form inputs and buttons
  inputs: {
    username: '#username, [data-testid="username-input"], input[name="username"]',
    email: '#email, [data-testid="email-input"], input[name="email"]',
    password: '#password, [data-testid="password-input"], input[name="password"]',
    confirmPassword: '#confirmPassword, [data-testid="confirm-password-input"], input[name="confirmPassword"]',
    name: '#name, [data-testid="name-input"], input[name="name"]',
    siteName: '#siteName, [data-testid="site-name-input"], input[name="siteName"]'
  },
  
  // Buttons
  buttons: {
    submit: 'button[type="submit"], [data-testid="setup-submit-button"]',
    cancel: '[data-testid="setup-cancel-button"]'
  },
  
  // Error messages
  errors: {
    formError: '[data-testid="form-error"], div.mb-4.p-3.bg-red-100, div[role="alert"]',
    usernameError: '#username-error, [data-testid="username-error"], .text-red-600',
    passwordError: '#password-error, [data-testid="password-error"], .text-red-600',
    confirmPasswordError: '#confirmPassword-error, [data-testid="confirm-password-error"], .text-red-600',
    emailError: '#email-error, [data-testid="email-error"], .text-red-600'
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
    password: 'input[type="password"], input[id="password"], input[name="password"]',
    confirmPassword: 'input[id="confirmPassword"], input[name="confirmPassword"], input[placeholder*="confirm"]',
    email: 'input[type="email"], input[id="email"], input[name="email"]',
    name: 'input[id="name"], input[name="name"]',
    siteName: 'input[id="siteName"], input[name="siteName"]',
    submitButton: 'button[type="submit"], input[type="submit"]',
    errors: '.text-red-600, .text-red-500, .text-red-700, [aria-invalid="true"]',
    adminDashboard: '.admin-header, .dashboard, [data-testid="admin-dashboard"]',
    setupContent: [
      'First User Setup',
      'Create Admin Account',
      'Initialize System',
      'Create First User',
      'Setup My Account'
    ],
    adminContent: [
      'Dashboard',
      'Admin',
      'Welcome'
    ]
  }
};

module.exports = FirstUserSelectors;
