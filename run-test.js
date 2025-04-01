#!/usr/bin/env node

/**
 * Simple wrapper script for Jest that directly passes all arguments
 * Usage: node run-test.js [test pattern or file]
 * Example: node run-test.js tests/unit/api/admin/dashboard/stats.test.ts
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Get any command line arguments
const args = process.argv.slice(2);

// Path to Jest binary
const jestBin = path.join(__dirname, 'node_modules', '.bin', 'jest');

// Always exclude e2e tests
const allArgs = ['--testPathIgnorePatterns=tests/e2e', ...args];

// Log the command being run
console.log(`Running: ${jestBin} ${allArgs.join(' ')}`);

// Run Jest synchronously so we can capture and return the exit code
const result = spawnSync(jestBin, allArgs, {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as Jest
process.exit(result.status);
