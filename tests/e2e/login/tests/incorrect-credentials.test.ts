/**
 * @file Incorrect credentials test
 * @description Tests authentication failure with incorrect credentials
 * @jest-environment node
 */

import { test, expect } from '@jest/globals';
import { Page } from 'puppeteer';
import { log, takeScreenshot } from '../../utils/test-utils';
import { waitForClientHydration, findElementWithRetry } from '../../utils/hydration-utils';
import loginSelectors from '../login.selectors';
import { LOGIN_TIMEOUT, BASE_URL, navigateToLoginPage } from '../login.setup';
import { check404Page, filterCriticalFailures, setupRequestInterception } from '../utils/login-test-utils';
import { ErrorDisplayResult, RequestLogEntry } from '../types/login.types';

/**
 * Test for displaying error message with incorrect credentials
 */
export default async function testIncorrectCredentials(page: Page): Promise<void> {
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
  await navigateToLoginPage(page, { screenshotName: 'auth-incorrect-initial' });

  // Wait for client-side hydration to complete
  await waitForClientHydration(page);
  
  // Check if page is a 404 page
  const is404Page = await check404Page(page, 'login-404-error');
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
  
  // Enter invalid credentials
  await usernameInput!.type('incorrect-user');
  await passwordInput!.type('password123456');
  
  // Take screenshot after entering credentials
  await takeScreenshot(page, 'auth-incorrect-entered');
  
  // Track request/response for debugging
  const requestLog = await setupRequestInterception(page);
  
  // Submit the form
  await submitButton!.click();
  
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
      loginSelectors
    );
    
    log('Error element found after submitting invalid credentials');
  } catch (error) {
    log('Error detection timed out:', (error as Error).message);
    
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
      const style = window.getComputedStyle(el);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
      const hasText = el.textContent?.trim().length ? el.textContent.trim().length > 0 : false;
      return isVisible && hasText;
    });
    
    // Get error messages for debugging
    const errorMessages = visibleErrors.map(el => el.textContent?.trim() || '');
    
    return {
      hasError: visibleErrors.length > 0,
      errorMessages
    };
  }, loginSelectors) as ErrorDisplayResult;
  
  // Log the results for debugging
  log('Error message check:', errorDisplayed);
  
  // Verify that an error message is displayed
  expect(errorDisplayed.hasError).toBe(true);
  
  // Log the request/response activity for debugging
  log('Auth request log:', requestLog);
  
  // Debug all failed requests
  if (failedRequests.length > 0) {
    console.log("All detected 404 responses during incorrect credentials test:");
    failedRequests.forEach((failure, index) => {
      console.log(`${index}. ${failure}`);
    });
  }
  
  // Filter critical failures
  const criticalFailures = filterCriticalFailures(failedRequests, BASE_URL);
  
  if (criticalFailures.length > 0) {
    console.error('Unexpected 404 errors detected during incorrect credentials test:');
    criticalFailures.forEach(failure => console.error(` - ${failure}`));
    throw new Error('Critical resources failed to load with 404 errors');
  }
}
