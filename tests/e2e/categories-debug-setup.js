/**
 * @file Setup utilities for categories debug tests
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password123!';

// Debug directories
const LOGS_DIR = path.join(process.cwd(), 'debug-logs');
const HTML_DUMPS_DIR = path.join(process.cwd(), 'html-dumps');
const DEBUG_LOG_FILE = path.join(LOGS_DIR, 'categories-debug-log.txt');

// Create debug directories if they don't exist
function ensureDirectories() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  if (!fs.existsSync(HTML_DUMPS_DIR)) {
    fs.mkdirSync(HTML_DUMPS_DIR, { recursive: true });
  }
  
  // Start with a fresh log file
  fs.writeFileSync(DEBUG_LOG_FILE, `Categories Debug Test Started: ${new Date().toISOString()}\n\n`, 'utf8');
}

// Helper function to log debug information
function logDebug(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(DEBUG_LOG_FILE, logMessage, 'utf8');
}

// Initialize browser with error tracking
async function setupBrowser(puppeteer) {
  logDebug('Starting browser for debug test...');
  
  // Launch browser with additional debugging capabilities
  const browser = await puppeteer.launch({
    headless: true, // Set to false to see the browser in action
    defaultViewport: { width: 1280, height: 800 },
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--window-size=1280,800']
  });
  
  const page = await browser.newPage();
  
  // Set extended timeouts
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  
  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    logDebug(`Console ${msg.type()}: ${text}`);
    
    // If it's an error, save it separately
    if (msg.type() === 'error') {
      const errorLogPath = path.join(LOGS_DIR, 'console-errors.log');
      fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - ${text}\n`, 'utf8');
    }
  });
  
  // Capture JS errors
  page.on('pageerror', error => {
    logDebug(`Page error: ${error.message}`);
    const errorLogPath = path.join(LOGS_DIR, 'js-errors.log');
    fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - ${error.message}\n`, 'utf8');
  });
  
  // Capture failed requests
  page.on('requestfailed', request => {
    logDebug(`Request failed: ${request.url()}`);
    const failedLogPath = path.join(LOGS_DIR, 'failed-requests.log');
    fs.appendFileSync(failedLogPath, `${new Date().toISOString()} - ${request.url()} - ${request.failure().errorText}\n`, 'utf8');
  });
  
  // Setup special JS error collection
  await page.evaluateOnNewDocument(() => {
    window.jsErrors = [];
    window.ajaxErrors = [];
    window.resourceErrors = [];
    window.consoleErrors = [];
    
    // Capture unhandled errors
    window.addEventListener('error', function(event) {
      if (event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement || event.target instanceof HTMLImageElement) {
        window.resourceErrors.push({
          message: event.message,
          url: event.target.src || event.target.href,
          type: event.target.tagName
        });
      } else {
        window.jsErrors.push({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null
        });
      }
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      window.jsErrors.push({
        type: 'unhandledrejection',
        message: event.reason?.message || 'Unknown promise rejection',
        stack: event.reason?.stack || null
      });
    });
    
    // Capture AJAX errors
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        if (!response.ok) {
          window.ajaxErrors.push({
            type: 'fetch',
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      } catch (error) {
        window.ajaxErrors.push({
          type: 'fetch',
          url: args[0],
          error: error.message
        });
        throw error;
      }
    };
    
    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      window.consoleErrors.push(args.join(' '));
      originalConsoleError.apply(console, args);
    };
  });
  
  logDebug('Browser setup complete');
  return { browser, page };
}

module.exports = {
  ensureDirectories,
  logDebug,
  setupBrowser,
  BASE_URL,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  LOGS_DIR,
  HTML_DUMPS_DIR,
  DEBUG_LOG_FILE
};
