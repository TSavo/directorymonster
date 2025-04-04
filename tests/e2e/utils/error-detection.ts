import { Page, expect } from '@playwright/test';

/**
 * Checks if the current page has a build error and fails the test if one is found
 * @param page Playwright page object
 * @param pageName Name of the page being tested (for error reporting)
 */
export async function checkForBuildErrors(page: Page, pageName: string): Promise<void> {
  // Get the page content
  const pageContent = await page.content();
  const pageUrl = page.url();
  const pageStatus = await page.evaluate(() => document.title);

  console.log(`Checking for errors on ${pageName} page`);
  console.log(`URL: ${pageUrl}`);
  console.log(`Title: ${pageStatus}`);

  // Check for common error indicators in the content
  const hasBuildError = pageContent.includes('Build Error') ||
                       pageContent.includes('Server Error') ||
                       pageContent.includes('Unhandled Runtime Error') ||
                       pageContent.includes('Application error:') ||
                       pageContent.includes('Error:') ||
                       pageContent.includes('Intentional error');

  // Check for missing critical elements that should be on every page
  const hasHeader = await page.locator('header').count() > 0;
  const hasFooter = await page.locator('footer').count() > 0;
  const missingCriticalElements = !hasHeader && !hasFooter;

  // Check if the page title is empty or contains error indicators
  const hasTitleError = !pageStatus ||
                       pageStatus.includes('Error') ||
                       pageStatus.includes('500');

  // Determine if the page has an error
  const hasError = hasBuildError || missingCriticalElements || hasTitleError;

  if (hasError) {
    console.error(`⚠️ ERROR DETECTED ON ${pageName.toUpperCase()} PAGE ⚠️`);
    console.error(`Build error: ${hasBuildError}`);
    console.error(`Missing critical elements: ${missingCriticalElements}`);
    console.error(`Title error: ${hasTitleError}`);

    // Try to extract the error message
    let errorMessage = 'No detailed error message found';
    try {
      // Try to get the first error element's text
      errorMessage = await page.locator('pre').first().textContent() || errorMessage;
    } catch (e) {
      console.log('Could not extract error message from pre element');
    }
    console.error('Error details:', errorMessage);

    // Take a screenshot of the error
    try {
      await page.screenshot({ path: `./test-results/${pageName.toLowerCase()}-error.png`, timeout: 5000 });
    } catch (e) {
      console.error('Failed to take screenshot:', e.message);
    }

    // Fail the test if there's an error
    expect(hasError).toBe(false, `Error detected on ${pageName} page: ${errorMessage}`);
  }

  return;
}

/**
 * Waits for the page to be fully loaded with a timeout
 * @param page Playwright page object
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // Wait for the network to be idle (no more than 2 connections for at least 500 ms)
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
    console.log('Network did not reach idle state, continuing anyway');
  });

  // Wait for the DOM content to be loaded
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {
    console.log('DOM content not fully loaded, continuing anyway');
  });
}
