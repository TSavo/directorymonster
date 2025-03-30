/**
 * @file Login page selectors
 * @description Centralized selectors for login page E2E tests
 */

const LoginSelectors = {
  // Main login page elements
  page: '[data-testid="login-page"], .login-page, main, body',
  formContainer: '[data-testid="login-form-container"], .login-form-container, form, .login',
  form: '[data-testid="login-form"], form, .login-form',
  heading: '[data-testid="login-heading"], h1, h2, .login-heading',
  subheading: '[data-testid="login-subheading"], h3, .login-subheading, p',
  
  // Form inputs and buttons - expanded with more generic selectors
  inputs: {
    username: '#username, [data-testid="username-input"], input[type="text"], input[type="email"], input[name="username"], input[name="email"], input[placeholder*="username"], input[placeholder*="email"]',
    password: '#password, [data-testid="password-input"], input[type="password"], input[name="password"], input[placeholder*="password"]',
    rememberMe: '#remember-me, [data-testid="remember-me-checkbox"], input[type="checkbox"]'
  },
  
  // Buttons - expanded with more generic selectors
  buttons: {
    submit: 'button[type="submit"], [data-testid="login-submit-button"], button[type="button"], button:contains("Log"), button:contains("Sign"), input[type="submit"], .login-button',
    resetPassword: '[data-testid="reset-password-link"], a[href*="reset-password"], a:contains("Reset"), a:contains("Forgot")',
    forgotPassword: '[data-testid="forgot-password-link"], a[href*="forgot-password"], a:contains("Forgot"), a[href*="reset"]'
  },
  
  // Error messages
  errors: {
    formError: '[data-testid="form-error"], div.mb-4.p-3.bg-red-100, div[role="alert"], .error, .text-red-600, .text-red-500',
    usernameError: '#username-error, [data-testid="username-error"], .text-red-600, .text-red-500, [aria-invalid="true"] + div',
    passwordError: '#password-error, [data-testid="password-error"], .text-red-600, .text-red-500, [aria-invalid="true"] + div'
  },
  
  // Loading states
  loading: {
    spinner: '[data-testid="loading-spinner"], .spinner, .loading',
    overlay: '[data-testid="loading-overlay"], .overlay, .loading-overlay'
  },
  
  // Success indicators
  success: {
    notification: '[data-testid="success-notification"], .success, .notification',
    redirectUrl: '/admin'
  },
  
  // Fallback selectors (when data-testid isn't available)
  fallback: {
    form: 'form, div > div > div',
    username: 'input[type="text"], input[type="email"], input:not([type="password"]):not([type="checkbox"]), input[id*="user"], input[name*="user"], input[id*="email"], input[name*="email"], input',
    password: 'input[type="password"], input[id*="password"], input[name*="password"]',
    submitButton: 'button[type="submit"], button:contains("Log"), button:contains("Sign"), button.submit, button.login, button',
    errors: '.text-red-600, .text-red-700, .text-red-500, .bg-red-100, [role="alert"], .error, div.mb-4.p-3.bg-red-100',
    loginText: 'h1, h2, h3, div:contains("Login"), div:contains("Sign In")',
    adminDashboard: '.admin-header, .dashboard, [data-testid="admin-dashboard"], nav, header'
  }
};

module.exports = LoginSelectors;
