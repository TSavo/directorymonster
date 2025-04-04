#!/usr/bin/env node

/**
 * Script to run all E2E tests in parallel for maximum speed
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const TESTS = [
  'homepage.spec.ts',
  'category.spec.ts',
  'search.spec.ts',
  'first-user.spec.ts',
  'login.spec.ts',
  'admin-dashboard.spec.ts'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Track results
const results = {
  passed: 0,
  failed: 0,
  total: TESTS.length
};

// Function to run a test
function runTest(testFile) {
  return new Promise((resolve) => {
    const testName = path.basename(testFile, '.spec.ts');
    const color = getColorForTest(testName);

    console.log(`${color}[${testName}] Starting test...${colors.reset}`);

    const startTime = Date.now();
    const process = spawn('npx', ['playwright', 'test', testFile], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`${color}[${testName}] ${text.trim()}${colors.reset}`);
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`${color}[${testName}] ${text.trim()}${colors.reset}`);
    });

    process.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(`${colors.green}[${testName}] ✓ PASSED in ${duration}s${colors.reset}`);
        results.passed++;
      } else {
        console.log(`${colors.red}[${testName}] ✗ FAILED in ${duration}s${colors.reset}`);
        results.failed++;
      }

      resolve({
        name: testName,
        success: code === 0,
        duration,
        output
      });
    });
  });
}

// Assign a color to each test
function getColorForTest(testName) {
  const colorMap = {
    'homepage': colors.cyan,
    'category': colors.magenta,
    'search': colors.yellow,
    'first-user': colors.green,
    'login': colors.blue,
    'admin-dashboard': colors.red
  };

  return colorMap[testName] || colors.blue;
}

// Main function
async function main() {
  console.log(`${colors.blue}Starting E2E tests in parallel...${colors.reset}`);
  const startTime = Date.now();

  // Run all tests in parallel
  const testPromises = TESTS.map(test => runTest(test));
  const testResults = await Promise.all(testPromises);

  // Print summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '-'.repeat(50));
  console.log(`${colors.blue}E2E Test Summary:${colors.reset}`);
  console.log(`${colors.blue}Total tests: ${results.total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.blue}Total duration: ${totalDuration}s${colors.reset}`);
  console.log('-'.repeat(50));

  // List failed tests
  if (results.failed > 0) {
    console.log(`\n${colors.red}Failed tests:${colors.reset}`);
    testResults
      .filter(result => !result.success)
      .forEach(result => {
        console.log(`${colors.red}- ${result.name} (${result.duration}s)${colors.reset}`);
      });
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});
