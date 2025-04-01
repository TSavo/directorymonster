#!/usr/bin/env node

/**
 * Simple wrapper script for Jest that always adds the --json flag
 * This ensures JSON output is always used without modifying the Jest config
 * This script properly passes all command line arguments to Jest
 */

const { spawn } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Path to Jest binary
const jestBin = path.join(__dirname, 'node_modules', '.bin', 'jest');

// Log the command being run for debugging purposes
console.log(`Running: ${jestBin} --json ${args.join(' ')}`);

// Create a child process to run Jest with the --json flag
const jestProcess = spawn(jestBin, ['--json', ...args], {
  stdio: 'inherit',
  shell: true
});

// Pass through the exit code
jestProcess.on('close', (code) => {
  process.exit(code);
});