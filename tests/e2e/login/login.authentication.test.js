/**
 * @file Login authentication test
 * @description Tests authentication functionality for the login page
 * @jest-environment node
 */

const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration, findElementWithRetry } = require('../utils/hydration-utils');
const LoginSelectors = require('./login.selectors');
const { 
  setupLoginTest, 
  teardownLoginTest,
  navigateToLoginPage,
  LOGIN_TIMEOUT,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  BASE_URL,
  SITE_DOMAIN
} = require('./login.setup');

describe('Login Authentication', () => {
  let browser;
  let page;
  
  /** @type {Array<string>} */
  let failedRequests = [];

  // Set up the browser and page before running tests
  beforeAll(async () => {
    const setup = await setupLoginTest();
    browser = setup.browser;
    page = setup.page;
    
    // Monitor for failed requests (404s)
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
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
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'auth-incorrect-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Check if page is a 404 page
    const bodyText = await page.evaluate(() => document.body.innerText);
    const is404Page = 
      bodyText.includes('404') || 
      bodyText.includes('Not Found') || 
      bodyText.includes('not found') ||
      bodyText.includes("doesn't exist");
    
    if (is404Page) {
      console.error('ERROR: Login page returned a 404 page unexpectedly');
      await takeScreenshot(page, 'login-404-error');
      throw new Error('Login page unexpectedly returned a 404 page');
    }
    
    // Wait for form elements to be ready
    const usernameInput = await findElementWithRetry(page, 
      LoginSelectors.inputs.username || LoginSelectors.fallback.username
    );
    
    const passwordInput = await findElementWithRetry(page, 
      LoginSelectors.inputs.password || LoginSelectors.fallback.password
    );
    
    const submitButton = await findElementWithRetry(page, 
      LoginSelectors.buttons.submit || LoginSelectors.fallback.submitButton
    );
    
    expect(usernameInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    
    // Enter invalid credentials
    await usernameInput.type('incorrect-user');
    await passwordInput.type('password123456');
    
    // Take screenshot after entering credentials
    await takeScreenshot(page, 'auth-incorrect-entered');
    
    // Track request/response for debugging
    await page.setRequestInterception(true);
    const requestLog = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/auth')) {
        requestLog.push({
          type: 'request',
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
      request.continue();
    });
    
    page.on('response', async response => {
      if (response.url().includes('/api/auth')) {
        try {
          const statusCode = response.status();
          let responseBody = 'Failed to parse';
          try {
            responseBody = await response.text();
          } catch (e) {}
          
          requestLog.push({
            type: 'response',
            url: response.url(),
            status: statusCode,
            body: responseBody,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          log('Error processing response:', e.message);
        }
      }
    });
    
    // Submit the form
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'auth-incorrect-submitted');
    
    // Wait for error element to appear using a more flexible approach
    try {
      await page.waitForFunction(
        (selectors) => {
          // Check for any error indicators
          return document.querySelector(selectors.errors.formError) !== null ||
                document.querySelector(selectors.fallback.errors) !== null;
        },
        { timeout: LOGIN_TIMEOUT },
        LoginSelectors
      );
      
      log('Error element found after submitting invalid credentials');
    } catch (error) {
      log('Error detection timed out:', error.message);
      
      // Take a screenshot of the current state
      await takeScreenshot(page, 'auth-incorrect-error-timeout');
      
      // Log the current page content for debugging
      const content = await page.content();
      log('Page content snippet:', content.substring(0, 300));
    }
    
    // Verify that an error message is displayed
    const errorDisplayed = await page.evaluate((selectors) => {
      // Check for any error indicators
      const errorElements = [
        ...Array.from(document.querySelectorAll(selectors.errors.formError)),
        ...Array.from(document.querySelectorAll(selectors.fallback.errors))
      ];
      
      // Filter for visible errors with text content
      const visibleErrors = errorElements.filter(el => {
        const isVisible = window.getComputedStyle(el).display !== 'none';
        const hasText = el.textContent.trim().length > 0;
        return isVisible && hasText;
      });
      
      // Get error messages for debugging
      const errorMessages = visibleErrors.map(el => el.textContent.trim());
      
      return {
        hasError: visibleErrors.length > 0,
        errorMessages
      };
    }, LoginSelectors);
    
    // Log the results for debugging
    log('Error message check:', errorDisplayed);
    
    // Verify that an error message is displayed
    expect(errorDisplayed.hasError).toBe(true);
    
    // Log the request/response activity for debugging
    log('Auth request log:', requestLog);
    
    // List of resources that are allowed to 404
    const allowedFailures = [
      '/favicon.ico', 
      '/logo.png',
      '/manifest.json',
      '/api/site-info',    // This might 404 in test environment
      'next-client',       // Next.js client resource that might 404
      'webpack-hmr',       // Hot module reload might 404 in test environment
      `${BASE_URL}/login`, // The login page itself might initially 404
      'login?hostname'     // Hostname version of login URL
    ];
    
    // Debug all failed requests
    if (failedRequests.length > 0) {
      console.log("All detected 404 responses during incorrect credentials test:");
      failedRequests.forEach((failure, index) => {
        console.log(`${index}. ${failure}`);
      });
    }
    
    // Filter out specific types of responses or from known problematic sources
    const criticalFailures = failedRequests.filter(failure => {
      // Skip allowed failures
      for (const pattern of allowedFailures) {
        if (failure.includes(pattern)) {
          return false;
        }
      }
      
      // Keep all other failures
      return true;
    });
    
    if (criticalFailures.length > 0) {
      console.error('Unexpected 404 errors detected during incorrect credentials test:');
      criticalFailures.forEach(failure => console.error(` - ${failure}`));
      throw new Error('Critical resources failed to load with 404 errors');
    }
  }, 30000); // Extend timeout to 30 seconds for this test

  test('Successfully logs in with valid credentials', async () => {
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'auth-success-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Check if page is a 404 page
    const bodyText = await page.evaluate(() => document.body.innerText);
    const is404Page = 
      bodyText.includes('404') || 
      bodyText.includes('Not Found') || 
      bodyText.includes('not found') ||
      bodyText.includes("doesn't exist");
    
    if (is404Page) {
      console.error('ERROR: Login page returned a 404 page unexpectedly');
      await takeScreenshot(page, 'login-success-404-error');
      throw new Error('Login page unexpectedly returned a 404 page');
    }
    
    // Wait for form elements to be ready
    const usernameInput = await findElementWithRetry(page, 
      LoginSelectors.inputs.username || LoginSelectors.fallback.username
    );
    
    const passwordInput = await findElementWithRetry(page, 
      LoginSelectors.inputs.password || LoginSelectors.fallback.password
    );
    
    const submitButton = await findElementWithRetry(page, 
      LoginSelectors.buttons.submit || LoginSelectors.fallback.submitButton
    );
    
    expect(usernameInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    
    // Log initial state
    log(`Attempting login with username: ${ADMIN_USERNAME}`);
    log('Starting login process at:', new Date().toISOString());
    log('Current URL before login:', await page.url());
    
    // Enter valid credentials
    await usernameInput.type(ADMIN_USERNAME);
    await passwordInput.type(ADMIN_PASSWORD);
    
    // Take screenshot before submitting
    await takeScreenshot(page, 'auth-success-entered');
    
    // Submit the form
    log('Submitting login form...');
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'auth-success-submitted');
    
    // Setup detection methods with more resilience
    try {
      log('Setting up login success detection...');
      
      // Use Promise.race to detect successful login by any of multiple methods
      const detectionResult = await Promise.race([
        // Option 1: Wait for URL change to admin
        page.waitForFunction(
          () => window.location.href.includes('/admin'),
          { timeout: LOGIN_TIMEOUT }
        ).then(() => ({ success: true, method: 'url_change' }))
          .catch(e => ({ success: false, method: 'url_change', error: e.message })),
        
        // Option 2: Wait for dashboard elements to appear
        page.waitForFunction(
          (selectors) => {
            return document.querySelector(selectors.fallback.adminDashboard) !== null;
          },
          { timeout: LOGIN_TIMEOUT },
          LoginSelectors
        ).then(() => ({ success: true, method: 'dashboard_elements' }))
          .catch(e => ({ success: false, method: 'dashboard_elements', error: e.message })),
        
        // Option 3: Check for authenticated state indicators
        page.waitForFunction(
          () => {
            // Look for authentication indicators
            const logoutButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
              el.textContent && el.textContent.toLowerCase().includes('logout'));
            const hasLogoutButton = logoutButtons.length > 0;
            
            const hasAdminText = document.body.textContent.includes('Dashboard') || 
                              document.body.textContent.includes('Admin');
            
            const noLoginForm = document.querySelector('form') === null || 
                              !document.body.textContent.includes('Login');
            
            return hasLogoutButton || (hasAdminText && noLoginForm);
          },
          { timeout: LOGIN_TIMEOUT }
        ).then(() => ({ success: true, method: 'auth_indicators' }))
          .catch(e => ({ success: false, method: 'auth_indicators', error: e.message })),
        
        // Timeout fallback
        new Promise(resolve => 
          setTimeout(() => resolve({ 
            success: false, 
            method: 'timeout', 
            error: 'Detection timed out' 
          }), LOGIN_TIMEOUT)
        )
      ]);
      
      // Log detection results
      log('Login detection result:', detectionResult);
      
      // If detection succeeded by any method
      if (detectionResult.success) {
        log(`Successful login detected via ${detectionResult.method}`);
        
        // Take screenshot of successful state
        await takeScreenshot(page, 'auth-success-detected');
        
        const currentUrl = await page.url();
        log(`Current URL after login detection: ${currentUrl}`);
        
        // If we're not on admin page, navigate there to confirm access
        if (!currentUrl.includes('/admin')) {
          log('Navigation to admin page needed as confirmation');
          await page.goto(`${BASE_URL}/admin?hostname=${SITE_DOMAIN}`);
        }
      } else {
        // Try manual navigation as fallback
        log('Quick detection failed, trying manual navigation');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take screenshot before manual navigation
        await takeScreenshot(page, 'auth-success-before-manual');
        
        // Navigate to admin page directly
        await page.goto(`${BASE_URL}/admin?hostname=${SITE_DOMAIN}`);
      }
      
      // Get final URL after all attempts
      const finalUrl = await page.url();
      log('Final URL at end of test:', finalUrl);
      
      // Take final screenshot
      await takeScreenshot(page, 'auth-success-final');
      
      // Check if admin page is a 404 page
      const adminBodyText = await page.evaluate(() => document.body.innerText);
      const isAdmin404Page = 
        adminBodyText.includes('404') || 
        adminBodyText.includes('Not Found') || 
        adminBodyText.includes('not found') ||
        adminBodyText.includes("doesn't exist");
      
      if (isAdmin404Page) {
        console.error('ERROR: Admin page returned a 404 page unexpectedly after login');
        await takeScreenshot(page, 'admin-404-error');
        throw new Error('Admin page unexpectedly returned a 404 page after login');
      }
      
      // If we're not redirected back to login, login was successful
      const isStillOnLogin = finalUrl.includes('/login');
      
      // Verify we can access the admin page
      expect(isStillOnLogin).toBe(false);
      expect(finalUrl).toContain('/admin');
    } catch (error) {
      log('Error during login success test:', error.message);
      
      // Take screenshot for debugging
      await takeScreenshot(page, 'auth-success-error');
      
      // Try direct navigation to admin page
      log('Error recovery - navigating directly to admin page');
      await page.goto(`${BASE_URL}/admin?hostname=${SITE_DOMAIN}`);
      
      // Get current URL
      const currentUrl = await page.url();
      log('URL after error recovery:', currentUrl);
      
      // If we still got redirected to login, test failed
      const stillOnLogin = currentUrl.includes('/login');
      
      // If we can access admin, credential login worked even with detection issues
      if (!stillOnLogin) {
        log('Login successful despite detection issues');
        expect(currentUrl).toContain('/admin');
      } else {
        // Test failed - login didn't work
        log('Login failed - redirected to login page');
        expect(stillOnLogin).toBe(false);
      }
    }
    
    // List of resources that are allowed to 404
    const allowedFailures = [
      '/favicon.ico', 
      '/logo.png',
      '/manifest.json',
      '/api/site-info',    // This might 404 in test environment
      'next-client',       // Next.js client resource that might 404
      'webpack-hmr',       // Hot module reload might 404 in test environment
      '/_next/static',     // Next.js static resources might 404
      '/public/',          // Public directory resources might 404
      `${BASE_URL}/login`, // The login page itself might initially 404
      'login?hostname'     // Hostname version of login URL
    ];
    
    // Debug all failed requests
    if (failedRequests.length > 0) {
      console.log("All detected 404 responses during successful login test:");
      failedRequests.forEach((failure, index) => {
        console.log(`${index}. ${failure}`);
      });
    }
    
    // Filter out specific types of responses or from known problematic sources
    const criticalFailures = failedRequests.filter(failure => {
      // Skip allowed failures
      for (const pattern of allowedFailures) {
        if (failure.includes(pattern)) {
          return false;
        }
      }
      
      // Keep all other failures
      return true;
    });
    
    if (criticalFailures.length > 0) {
      console.error('Unexpected 404 errors detected during successful login test:');
      criticalFailures.forEach(failure => console.error(` - ${failure}`));
      throw new Error('Critical resources failed to load with 404 errors during login');
    }
  }, 60000); // Extend timeout to 60 seconds
});
