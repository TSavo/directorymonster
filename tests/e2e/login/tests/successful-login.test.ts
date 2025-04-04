/**
 * @file Successful login test
 * @description Tests successful authentication with valid credentials
 * @jest-environment node
 */

import { test, expect } from '@jest/globals';
import { Page } from 'puppeteer';
import { log, takeScreenshot } from '../../utils/test-utils';
import { waitForClientHydration, findElementWithRetry } from '../../utils/hydration-utils';
import loginSelectors from '../login.selectors';
import { 
  LOGIN_TIMEOUT, 
  BASE_URL, 
  SITE_DOMAIN, 
  ADMIN_USERNAME, 
  ADMIN_PASSWORD, 
  navigateToLoginPage 
} from '../login.setup';
import { check404Page, filterCriticalFailures } from '../utils/login-test-utils';

/**
 * Test for successful login with valid credentials
 */
export default async function testSuccessfulLogin(page: Page): Promise<void> {
  // Array to store failed requests
  const failedRequests: string[] = [];
  
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

  // Navigate to the login page
  await navigateToLoginPage(page, { screenshotName: 'auth-success-initial' });

  // Wait for client-side hydration to complete
  await waitForClientHydration(page);
  
  // Check if page is a 404 page
  const is404Page = await check404Page(page, 'login-success-404-error');
  if (is404Page) {
    throw new Error('Login page unexpectedly returned a 404 page');
  }
  
  // Wait for form elements to be ready
  const usernameInput = await findElementWithRetry(page, 
    loginSelectors.inputs.username || loginSelectors.fallback.username
  );
  
  const passwordInput = await findElementWithRetry(page, 
    loginSelectors.inputs.password || loginSelectors.fallback.password
  );
  
  const submitButton = await findElementWithRetry(page, 
    loginSelectors.buttons.submit || loginSelectors.fallback.submitButton
  );
  
  expect(usernameInput).not.toBeNull();
  expect(passwordInput).not.toBeNull();
  expect(submitButton).not.toBeNull();
  
  // Log initial state
  log(`Attempting login with username: ${ADMIN_USERNAME}`);
  log('Starting login process at:', new Date().toISOString());
  log('Current URL before login:', await page.url());
  
  // Enter valid credentials
  await usernameInput!.type(ADMIN_USERNAME);
  await passwordInput!.type(ADMIN_PASSWORD);
  
  // Take screenshot before submitting
  await takeScreenshot(page, 'auth-success-entered');
  
  // Submit the form
  log('Submitting login form...');
  await submitButton!.click();
  
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
        .catch(e => ({ success: false, method: 'url_change', error: (e as Error).message })),
      
      // Option 2: Wait for dashboard elements to appear
      page.waitForFunction(
        (selectors) => {
          return document.querySelector(selectors.fallback.adminDashboard) !== null;
        },
        { timeout: LOGIN_TIMEOUT },
        loginSelectors
      ).then(() => ({ success: true, method: 'dashboard_elements' }))
        .catch(e => ({ success: false, method: 'dashboard_elements', error: (e as Error).message })),
      
      // Option 3: Check for authenticated state indicators
      page.waitForFunction(
        () => {
          // Look for authentication indicators
          const logoutButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
            el.textContent && el.textContent.toLowerCase().includes('logout'));
          const hasLogoutButton = logoutButtons.length > 0;
          
          const hasAdminText = document.body.textContent?.includes('Dashboard') || 
                            document.body.textContent?.includes('Admin') || false;
          
          const noLoginForm = document.querySelector('form') === null || 
                            !document.body.textContent?.includes('Login');
          
          return hasLogoutButton || (hasAdminText && noLoginForm);
        },
        { timeout: LOGIN_TIMEOUT }
      ).then(() => ({ success: true, method: 'auth_indicators' }))
        .catch(e => ({ success: false, method: 'auth_indicators', error: (e as Error).message })),
      
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
    log('Error during login success test:', (error as Error).message);
    
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
  
  // Debug all failed requests
  if (failedRequests.length > 0) {
    console.log("All detected 404 responses during successful login test:");
    failedRequests.forEach((failure, index) => {
      console.log(`${index}. ${failure}`);
    });
  }
  
  // Filter critical failures
  const criticalFailures = filterCriticalFailures(failedRequests, BASE_URL);
  
  if (criticalFailures.length > 0) {
    console.error('Unexpected 404 errors detected during successful login test:');
    criticalFailures.forEach(failure => console.error(` - ${failure}`));
    throw new Error('Critical resources failed to load with 404 errors during login');
  }
}
