/**
 * @file Login authentication test
 * @description Tests authentication functionality for the login page
 * @jest-environment node
 */

import { describe, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Browser, Page } from 'puppeteer';
import { setupLoginTest, teardownLoginTest } from './login.setup';
import testIncorrectCredentials from './tests/incorrect-credentials.test';
import testSuccessfulLogin from './tests/successful-login.test';

describe('Login Authentication', () => {
  let browser: Browser;
  let page: Page;
  
  // Array to store failed requests
  let failedRequests: string[] = [];

  // Set up the browser and page before running tests
  beforeAll(async () => {
    const setup = await setupLoginTest();
    browser = setup.browser;
    page = setup.page;
    
    // Monitor for failed requests (404s)
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });

    // Monitor for response status codes
    page.on('response', response => {
      const status = response.status();
      const url = response.url();
      
      // Only track 404 responses
      if (status === 404) {
        failedRequests.push(`404: ${url}`);
      }
    });
  });
  
  // Reset failed requests between tests
  beforeEach(() => {
    failedRequests = [];
  });

  // Clean up after all tests
  afterAll(async () => {
    await teardownLoginTest(browser);
  });

  test('Displays error message for incorrect credentials', async () => {
    await testIncorrectCredentials(page);
  }, 30000); // Extend timeout to 30 seconds for this test

  test('Successfully logs in with valid credentials', async () => {
    await testSuccessfulLogin(page);
  }, 60000); // Extend timeout to 60 seconds
});
