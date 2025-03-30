/**
 * @file Core utilities for E2E testing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';

// Debug directories setup
const LOGS_DIR = path.join(process.cwd(), 'debug-logs');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Waits for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Takes a screenshot and saves it
 * @param {Object} page - Puppeteer page object
 * @param {string} name - Name for the screenshot
 * @returns {Promise<string>} - Path to the saved screenshot
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved to: ${filePath}`);
  
  return filePath;
}

/**
 * Logs a message with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, error, warning)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Also append to file log
  const logFile = path.join(LOGS_DIR, 'e2e-tests.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * Extracts text content from an element
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - Element selector
 * @returns {Promise<string>} - Element text content
 */
async function getElementText(page, selector) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element ? element.textContent.trim() : '';
  }, selector);
}

/**
 * Checks if an element exists on the page
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - Element selector
 * @returns {Promise<boolean>} - Whether the element exists
 */
async function elementExists(page, selector) {
  return page.evaluate((sel) => {
    return document.querySelector(sel) !== null;
  }, selector);
}

/**
 * Finds and clicks a button by its text content
 * @param {Object} page - Puppeteer page object
 * @param {string} buttonText - Text content to look for
 * @returns {Promise<boolean>} - Whether the button was found and clicked
 */
async function clickButtonByText(page, buttonText) {
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button, a.btn, a[role="button"]'));
    const button = buttons.find(btn => 
      btn.textContent.trim().includes(text)
    );
    
    if (button) {
      button.click();
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

module.exports = {
  BASE_URL,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  LOGS_DIR,
  SCREENSHOTS_DIR,
  wait,
  takeScreenshot,
  log,
  getElementText,
  elementExists,
  clickButtonByText
};
