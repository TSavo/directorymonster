#!/usr/bin/env node

/**
 * Wrapper script for Jest that warns about running e2e tests
 * This script is used by the npm run test:with-e2e command
 */

const { spawn } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Path to Jest binary
const jestBin = path.join(__dirname, 'node_modules', '.bin', 'jest');

// Display warning
console.warn('\x1b[31mWARNING: You are about to run ALL tests, including E2E tests!\x1b[0m');
console.warn('\x1b[31mThis may cause performance issues and is not recommended for regular development.\x1b[0m');
console.warn('\x1b[31mConsider using "npm test" instead to exclude E2E tests.\x1b[0m');
console.warn('\x1b[31m---------------------------------------------------------------------\x1b[0m\n');

// Ask for confirmation
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('\x1b[33mDo you want to continue? (y/N): \x1b[0m', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() === 'y') {
    console.log('\nRunning all tests including E2E tests...\n');
    
    // Create a child process to run Jest
    const jestProcess = spawn(jestBin, args, {
      stdio: 'inherit',
      shell: true
    });
    
    // Pass through the exit code
    jestProcess.on('close', (code) => {
      process.exit(code);
    });
  } else {
    console.log('\nTest run cancelled. Use "npm test" to run tests without E2E tests.\n');
    process.exit(0);
  }
});
