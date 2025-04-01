#!/usr/bin/env node

/**
 * Helper script to run specific tests while ALWAYS excluding e2e tests
 * Usage: node run-specific-tests.js [test pattern]
 * Example: node run-specific-tests.js "tests/unit/api/admin"
 *
 * NOTE: This script will NEVER run e2e tests, even if you specify them directly.
 * To run e2e tests, use the dedicated e2e test commands.
 */

const { spawn } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Path to Jest binary
const jestBin = path.join(__dirname, 'node_modules', '.bin', 'jest');

// Always exclude e2e tests no matter what
let testArgs = ['--testPathIgnorePatterns=tests/e2e'];

// Add all arguments from the command line
// Jest will automatically recognize file paths as test files to run
testArgs = [...testArgs, ...args];

// Check if user is trying to run e2e tests
if (args.some(arg => arg.includes('e2e'))) {
  console.warn('\x1b[33mWARNING: You appear to be trying to run e2e tests.\x1b[0m');
  console.warn('\x1b[33mThis command NEVER runs e2e tests. Use npm run test:e2e instead.\x1b[0m');
  console.warn('\x1b[33mProceeding with non-e2e tests only...\x1b[0m\n');
}

// Log the command being run
console.log(`Running: ${jestBin} ${testArgs.join(' ')}`);

// Create a child process to run Jest
const jestProcess = spawn(jestBin, testArgs, {
  stdio: 'inherit',
  shell: true
});

// Pass through the exit code
jestProcess.on('close', (code) => {
  process.exit(code);
});
