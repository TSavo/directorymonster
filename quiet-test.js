#!/usr/bin/env node

/**
 * Quiet wrapper for Jest that reduces output
 * Usage: node quiet-test.js [test pattern or file]
 * Example: node quiet-test.js tests/unit/api/admin/dashboard/stats.test.ts
 */

const { spawnSync } = require('child_process');

// Get any command line arguments
const args = process.argv.slice(2);

// Add flags to reduce output
const quietArgs = [
  '--silent',           // Prevent tests from printing console.log statements
  '--noStackTrace',     // Disable stack trace in test failures
  '--verbose=false',    // Disable verbose output
  '--testPathIgnorePatterns=tests/e2e', // Always exclude e2e tests
  ...args
];

// Log the command being run
console.log(`Running tests in quiet mode...`);

// Run Jest synchronously using npx
const result = spawnSync('npx', ['jest', ...quietArgs], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as Jest
process.exit(result.status);
