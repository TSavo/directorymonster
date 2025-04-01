#!/usr/bin/env node

/**
 * Failures-only wrapper for Jest
 * Usage: node failures-only.js [test pattern or file]
 * Example: node failures-only.js tests/unit/api/admin/dashboard/stats.test.ts
 */

const { spawnSync } = require('child_process');

// Get any command line arguments
const args = process.argv.slice(2);

// Add flags to only show failures
const failuresOnlyArgs = [
  '--silent',           // Prevent tests from printing console.log statements
  '--onlyFailures',     // Only run tests that failed in the previous run
  '--testPathIgnorePatterns=tests/e2e', // Always exclude e2e tests
  ...args
];

// Log the command being run
console.log(`Running tests (failures only)...`);

// Run Jest synchronously using npx
const result = spawnSync('npx', ['jest', ...failuresOnlyArgs], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as Jest
process.exit(result.status);
