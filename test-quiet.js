#!/usr/bin/env node

/**
 * Quiet mode wrapper for Jest
 * Runs tests with minimal console output
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Run the main jest-runner script with quiet mode
const result = spawnSync('node', ['jest-runner.js', '--mode=quiet', ...args], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code
process.exit(result.status);
