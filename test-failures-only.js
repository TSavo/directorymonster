#!/usr/bin/env node

/**
 * Failures-only wrapper for Jest
 * Only runs tests that failed in the previous run
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Run the main jest-runner script with failures-only mode
const result = spawnSync('node', ['jest-runner.js', '--mode=failures-only', ...args], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code
process.exit(result.status);
