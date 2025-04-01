#!/usr/bin/env node

/**
 * Minimal output wrapper for Jest
 * Runs tests with custom minimal formatter
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Run the main jest-runner script with minimal mode
const result = spawnSync('node', ['jest-runner.js', '--mode=minimal', ...args], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code
process.exit(result.status);
