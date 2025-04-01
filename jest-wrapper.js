#!/usr/bin/env node

/**
 * Wrapper script for Jest that ensures e2e tests are never run
 * This script is used by the npm test command
 */

const { spawn } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Path to Jest binary
const jestBin = path.join(__dirname, 'node_modules', '.bin', 'jest');

// Check if --testPathIgnorePatterns is already specified
const hasIgnorePattern = args.some(arg => arg.startsWith('--testPathIgnorePatterns'));

// If not specified, add it to exclude e2e tests
const finalArgs = hasIgnorePattern 
  ? args 
  : ['--testPathIgnorePatterns=tests/e2e', ...args];

// Check if user is trying to run e2e tests
if (args.some(arg => arg.includes('e2e'))) {
  console.warn('\x1b[33mWARNING: You appear to be trying to run e2e tests.\x1b[0m');
  console.warn('\x1b[33mThis command NEVER runs e2e tests. Use npm run test:e2e instead.\x1b[0m');
  console.warn('\x1b[33mProceeding with non-e2e tests only...\x1b[0m\n');
}

// Log the command being run
console.log(`Running: ${jestBin} ${finalArgs.join(' ')}`);

// Create a child process to run Jest
const jestProcess = spawn(jestBin, finalArgs, {
  stdio: 'inherit',
  shell: true
});

// Pass through the exit code
jestProcess.on('close', (code) => {
  process.exit(code);
});
