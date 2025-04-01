#!/usr/bin/env node

/**
 * Direct wrapper for Jest that uses npx jest
 * Usage: node direct-test.js [test pattern or file]
 * Example: node direct-test.js tests/unit/api/admin/dashboard/stats.test.ts
 */

const { spawnSync } = require('child_process');

// Get any command line arguments
const args = process.argv.slice(2);

// Log the command being run
console.log(`Running: npx jest ${args.join(' ')}`);

// Run Jest synchronously using npx
const result = spawnSync('npx', ['jest', ...args], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as Jest
process.exit(result.status);
