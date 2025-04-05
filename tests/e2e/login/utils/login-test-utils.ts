/**
 * @file Login test utilities
 * @description Common utilities for login tests
 */

import { Page } from 'puppeteer';
import { log, takeScreenshot } from '../../utils/test-utils';
import { RequestLogEntry } from '../types/login.types';

/**
 * List of resources that are allowed to 404
 */
export const allowedFailures = [
  '/favicon.ico', 
  '/logo.png',
  '/manifest.json',
  '/api/site-info',    // This might 404 in test environment
  'next-client',       // Next.js client resource that might 404
  'webpack-hmr',       // Hot module reload might 404 in test environment
  '/_next/static',     // Next.js static resources might 404
  '/public/',          // Public directory resources might 404
  '/login',            // The login page itself might initially 404
  'login?hostname'     // Hostname version of login URL
];

/**
 * Check if the page is a 404 page
 * @param page - Puppeteer page object
 * @param screenshotName - Name for the screenshot if 404 is detected
 * @returns Whether the page is a 404 page
 */
export async function check404Page(page: Page, screenshotName: string): Promise<boolean> {
  const bodyText = await page.evaluate(() => document.body.innerText);
  const is404Page = 
    bodyText.includes('404') || 
    bodyText.includes('Not Found') || 
    bodyText.includes('not found') ||
    bodyText.includes("doesn't exist");
  
  if (is404Page) {
    console.error('ERROR: Page returned a 404 page unexpectedly');
    await takeScreenshot(page, screenshotName);
  }
  
  return is404Page;
}

/**
 * Setup request interception for debugging
 * @param page - Puppeteer page object
 * @returns Array to store request logs
 */
export async function setupRequestInterception(page: Page): Promise<RequestLogEntry[]> {
  const requestLog: RequestLogEntry[] = [];
  
  await page.setRequestInterception(true);
  
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
        log('Error processing response:', (e as Error).message);
      }
    }
  });
  
  return requestLog;
}

/**
 * Filter critical failures from failed requests
 * @param failedRequests - Array of failed request strings
 * @returns Array of critical failures
 */
export function filterCriticalFailures(failedRequests: string[], baseUrl: string): string[] {
  // Add the base URL to allowed failures
  const allAllowedFailures = [...allowedFailures, baseUrl];
  
  return failedRequests.filter(failure => {
    // Skip allowed failures
    for (const pattern of allAllowedFailures) {
      if (failure.includes(pattern)) {
        return false;
      }
    }
    
    // Keep all other failures
    return true;
  });
}
