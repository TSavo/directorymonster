#!/usr/bin/env node

/**
 * E2E test wrapper for Jest
 * Runs tests including e2e tests (use with caution)
 */

const { spawnSync } = require('child_process');
const path = require('path');
const readline = require('readline');

// Get any command line arguments
const args = process.argv.slice(2);

// Display warning
console.warn('\x1b[31mWARNING: You are about to run ALL tests, including E2E tests!\x1b[0m');
console.warn('\x1b[31mThis may cause performance issues and is not recommended for regular development.\x1b[0m');
console.warn('\x1b[31mConsider using "npm test" instead to exclude E2E tests.\x1b[0m');
console.warn('\x1b[31m---------------------------------------------------------------------\x1b[0m\n');

// Ask for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\x1b[33mDo you want to continue? (y/N): \x1b[0m', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'y') {
    console.log('\nRunning all tests including E2E tests...\n');
    
    // Run the main jest-runner script with e2e tests included
    const result = spawnSync('node', ['jest-runner.js', '--with-e2e', ...args], {
      stdio: 'inherit',
      shell: true
    });
    
    // Exit with the same code
    process.exit(result.status);
  } else {
    console.log('\nTest run cancelled. Use "npm test" to run tests without E2E tests.\n');
    process.exit(0);
  }
});
