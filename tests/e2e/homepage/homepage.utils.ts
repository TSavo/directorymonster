/**
 * Homepage test utilities
 * 
 * Common functions and utilities shared across homepage tests
 */

import { Page } from 'puppeteer';
import { HomepageSelectors } from './homepage.selectors';
import { log, takeScreenshot } from '../utils/test-utils';
import { waitForClientHydration } from '../utils/hydration-utils';

// Configuration
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';

/**
 * Navigate to the homepage with hostname parameter for multitenancy
 */
export async function navigateToHomepage(page: Page, options = { takeScreenshot: true }): Promise<void> {
  await page.goto(`${BASE_URL}?hostname=${SITE_DOMAIN}`, {
    waitUntil: 'networkidle2',
  });

  // Wait for client-side hydration
  await waitForClientHydration(page);
  
  if (options.takeScreenshot) {
    await takeScreenshot(page, 'homepage-loaded');
  }
}

/**
 * Check if the page has a valid title
 */
export async function validatePageTitle(page: Page): Promise<boolean> {
  const title = await page.title();
  log(`Page title: ${title}`);
  
  return title.length > 0;
}

/**
 * Check if the page has body content
 */
export async function hasBodyContent(page: Page): Promise<boolean> {
  return page.evaluate(() => document.body.textContent.length > 100);
}

/**
 * Find all navigation links on the page
 */
export async function findNavigationLinks(page: Page): Promise<Array<{href: string, text: string}>> {
  // Try to find navigation within designated navigation container first
  const navSelector = HomepageSelectors.page.navigation;
  const fallbackSelector = 'a';
  
  return page.evaluate((navSelector, fallbackSelector) => {
    // First try to find links within navigation
    let links = Array.from(document.querySelectorAll(`${navSelector} a`));
    
    // If no links found within navigation, find all links on the page
    if (links.length === 0) {
      links = Array.from(document.querySelectorAll(fallbackSelector));
    }
    
    return links
      .filter(link => link.href && !link.href.includes('#') && link.textContent.trim().length > 0)
      .map(link => ({ 
        href: link.href, 
        text: link.textContent.trim() 
      }));
  }, navSelector, fallbackSelector);
}

/**
 * Find a search input on the page
 */
export async function findSearchInput(page: Page): Promise<boolean> {
  const searchSelector = HomepageSelectors.search.input;
  const fallbackSelector = HomepageSelectors.fallback.search;
  
  return page.evaluate((searchSelector, fallbackSelector) => {
    // First try to find the designated search input
    let searchInput = document.querySelector(searchSelector);
    
    // If not found, try fallback selectors
    if (!searchInput) {
      searchInput = document.querySelector(fallbackSelector);
    }
    
    return !!searchInput;
  }, searchSelector, fallbackSelector);
}
