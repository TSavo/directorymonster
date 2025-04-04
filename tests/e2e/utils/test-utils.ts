/**
 * @file Core utilities for E2E testing
 */

import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'puppeteer';

// Configuration
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';

// Debug directories setup
export const LOGS_DIR = path.join(process.cwd(), 'debug-logs');
export const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Waits for a specified time
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Takes a screenshot and saves it
 * @param page - Puppeteer page object
 * @param name - Name for the screenshot
 * @returns Path to the saved screenshot
 */
export async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved to: ${filePath}`);
  
  return filePath;
}

/**
 * Logs a message with timestamp
 * @param message - Message to log
 * @param level - Log level (info, error, warning)
 */
export function log(message: string, level: 'info' | 'error' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Also append to file log
  const logFile = path.join(LOGS_DIR, 'e2e-tests.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * Extracts text content from an element
 * @param page - Puppeteer page object
 * @param selector - Element selector
 * @returns Element text content
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element ? element.textContent?.trim() || '' : '';
  }, selector);
}

/**
 * Checks if an element exists on the page
 * @param page - Puppeteer page object
 * @param selector - Element selector
 * @returns Whether the element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    return document.querySelector(sel) !== null;
  }, selector);
}

/**
 * Finds and clicks a button by its text content
 * @param page - Puppeteer page object
 * @param buttonText - Text content to look for
 * @returns Whether the button was found and clicked
 */
export async function clickButtonByText(page: Page, buttonText: string): Promise<boolean> {
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button, a.btn, a[role="button"]'));
    const button = buttons.find(btn => 
      btn.textContent?.trim().includes(text) || false
    );
    
    if (button) {
      (button as HTMLElement).click();
      return true;
    }
    return false;
  }, buttonText);
  
  if (clicked) {
    log(`Clicked button with text: ${buttonText}`);
    return true;
  }
  
  log(`Could not find button with text: ${buttonText}`, 'warning');
  return false;
}
