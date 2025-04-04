/**
 * @file Login test types
 * @description Type definitions for login tests
 */

import { Browser, Page } from 'puppeteer';

export interface LoginTestSetup {
  browser: Browser;
  page: Page;
}

export interface LoginSelectors {
  page: string;
  formContainer: string;
  form: string;
  heading: string;
  subheading: string;
  inputs: {
    username: string;
    password: string;
    rememberMe: string;
  };
  buttons: {
    submit: string;
    resetPassword: string;
    forgotPassword: string;
  };
  errors: {
    formError: string;
    usernameError: string;
    passwordError: string;
  };
  loading: {
    spinner: string;
    overlay: string;
  };
  success: {
    notification: string;
    redirectUrl: string;
  };
  fallback: {
    form: string;
    username: string;
    password: string;
    submitButton: string;
    errors: string;
    loginText: string;
    adminDashboard: string;
  };
}

export interface LoginCredentials {
  username?: string;
  password?: string;
  takeScreenshots?: boolean;
}

export interface LoginOptions {
  selectors?: LoginSelectors;
  screenshotPrefix?: string;
}

export interface NavigateOptions {
  screenshotName?: string;
}

export interface RequestLogEntry {
  type: 'request' | 'response';
  url: string;
  method?: string;
  timestamp: string;
  status?: number;
  body?: string;
}

export interface ErrorDisplayResult {
  hasError: boolean;
  errorMessages: string[];
}
