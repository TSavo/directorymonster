/**
 * This script runs the secure-tenant-context test directly 
 */

// Run the jest test
console.log('Running secure-tenant-context test...');

// Import Jest
require('jest');

// Run the test
const { run } = require('jest-cli');

// Configure and run
run(['--config', 'jest.config.js', 'secure-tenant-context.test.ts']);
