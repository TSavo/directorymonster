#!/usr/bin/env node

/**
 * Specific test wrapper for Jest
 * Runs specific tests (excluding e2e tests)
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Run the main jest-runner script in default mode
const result = spawnSync('node', ['jest-runner.js', ...args], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code
process.exit(result.status);
