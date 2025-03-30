/**
 * @file Convert E2E Test Script
 * @description Utility to convert existing E2E tests to the new organized structure
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Extract selectors from test file
 */
function extractSelectors(content) {
  // Regular expression to find data-testid selectors
  const dataTestIdRegex = /\[data-testid=['"]([^'"]+)['"]\]/g;
  const selectorsMap = {};
  
  let match;
  while ((match = dataTestIdRegex.exec(content)) !== null) {
    const selector = match[1];
    selectorsMap[selector] = `[data-testid="${selector}"]`;
  }
  
  // Also look for class selectors
  const classRegex = /\.([a-zA-Z0-9-_]+)/g;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    // Only add if it looks like a component class, not a utility class
    if (className.length > 3 && !className.includes('w-') && !className.includes('h-') && !className.includes('p-') && !className.includes('m-')) {
      selectorsMap[className] = `.${className}`;
    }
  }
  
  return selectorsMap;
}

/**
 * Group tests by functionality
 */
function groupTestsByFunction(content) {
  // Split by test blocks
  const testBlocks = content.split(/test\(['"]/);
  
  // Skip the first part (imports and setup)
  const setupPart = testBlocks[0];
  
  // Group the rest by functionality
  const testGroups = {};
  
  for (let i = 1; i < testBlocks.length; i++) {
    const block = testBlocks[i];
    const nameEndIndex = block.indexOf("'");
    const name = block.substring(0, nameEndIndex).trim();
    
    // Classify the test by its name
    if (name.includes('render') || name.includes('element')) {
      testGroups.rendering = testGroups.rendering || [];
      testGroups.rendering.push(`test('${block}`);
    } else if (name.includes('navigation') || name.includes('menu') || name.includes('link')) {
      testGroups.navigation = testGroups.navigation || [];
      testGroups.navigation.push(`test('${block}`);
    } else if (name.includes('responsive') || name.includes('mobile') || name.includes('viewport')) {
      testGroups.responsive = testGroups.responsive || [];
      testGroups.responsive.push(`test('${block}`);
    } else if (name.includes('search')) {
      testGroups.search = testGroups.search || [];
      testGroups.search.push(`test('${block}`);
    } else if (name.includes('content') || name.includes('section') || name.includes('footer')) {
      testGroups.content = testGroups.content || [];
      testGroups.content.push(`test('${block}`);
    } else if (name.includes('error') || name.includes('404')) {
      testGroups['404'] = testGroups['404'] || [];
      testGroups['404'].push(`test('${block}`);
    } else if (name.includes('performance') || name.includes('load time')) {
      testGroups.performance = testGroups.performance || [];
      testGroups.performance.push(`test('${block}`);
    } else {
      // Default to rendering if we can't classify
      testGroups.misc = testGroups.misc || [];
      testGroups.misc.push(`test('${block}`);
    }
  }
  
  return { setupPart, testGroups };
}

/**
 * Create selectors file
 */
async function createSelectorsFile(pageName, selectorsMap, outputDir) {
  const content = `/**
 * @file ${pageName} selectors
 * @description Centralized selectors for ${pageName} E2E tests
 */

const ${pageName}Selectors = {
${Object.entries(selectorsMap).map(([key, value]) => `  ${key}: '${value}'`).join(',\n')}
};

module.exports = ${pageName}Selectors;
`;

  await writeFile(path.join(outputDir, `${pageName}.selectors.js`), content);
}

/**
 * Create test file
 */
async function createTestFile(pageName, testType, tests, setupPart, outputDir) {
  // Replace data-testid selectors with references to the selectors file
  let processedTests = tests.join('\n\n');
  
  const content = `/**
 * @file ${pageName} ${testType} test
 * @description Tests that the ${pageName} ${testType} works correctly
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const ${pageName}Selectors = require('./${pageName}.selectors');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';

describe('${pageName} ${testType.charAt(0).toUpperCase() + testType.slice(1)}', () => {
${setupPart.split('beforeAll')[1].split('afterAll')[0]}
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      devtools: process.env.NODE_ENV !== 'production',
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
      ],
    });
    
    page = await browser.newPage();
    
    // Set viewport to a standard desktop size
    await page.setViewport({
      width: 1280,
      height: 800,
    });

    // Enable console logging for debugging
    page.on('console', (message) => {
      if (process.env.DEBUG) {
        console.log(\`Browser console: \${message.text()}\`);
      }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

${processedTests}
});
`;

  await writeFile(path.join(outputDir, `${pageName}.${testType}.test.js`), content);
}

/**
 * Create suite file
 */
async function createSuiteFile(pageName, testGroups, outputDir) {
  const testTypes = Object.keys(testGroups);
  
  const content = `/**
 * @file ${pageName} test suite
 * @description Main suite file that imports and runs all ${pageName} tests
 * @jest-environment node
 */

// Import all ${pageName} test cases
${testTypes.map(type => `require('./${pageName}.${type}.test');`).join('\n')}
`;

  await writeFile(path.join(outputDir, `${pageName}.suite.test.js`), content);
}

/**
 * Main function
 */
async function convertTest(inputPath, pageName) {
  try {
    // Read the input file
    const content = await readFile(inputPath, 'utf8');
    
    // Extract selectors
    const selectorsMap = extractSelectors(content);
    
    // Group tests by functionality
    const { setupPart, testGroups } = groupTestsByFunction(content);
    
    // Create output directory
    const outputDir = path.join(path.dirname(inputPath), pageName);
    await mkdir(outputDir, { recursive: true });
    
    // Create selectors file
    await createSelectorsFile(pageName, selectorsMap, outputDir);
    
    // Create test files
    for (const [testType, tests] of Object.entries(testGroups)) {
      await createTestFile(pageName, testType, tests, setupPart, outputDir);
    }
    
    // Create suite file
    await createSuiteFile(pageName, testGroups, outputDir);
    
    console.log(`✓ Successfully converted ${inputPath} to organized test structure in ${outputDir}`);
  } catch (error) {
    console.error(`✗ Error converting test: ${error.message}`);
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node convert-e2e-test.js <input-file> <page-name>');
    process.exit(1);
  }
  
  const [inputPath, pageName] = args;
  convertTest(inputPath, pageName).catch(console.error);
}

module.exports = { convertTest };
