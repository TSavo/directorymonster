/**
 * @file Jest configuration for E2E tests
 */

module.exports = {
  // Set the test environment
  testEnvironment: 'node',
  
  // Define test match pattern to only include suite files
  testMatch: ['**/tests/e2e/**/*.suite.test.js'],
  
  // Set timeout to 1 minute for long-running tests
  testTimeout: 60000,
  
  // Global setup and teardown
  globalSetup: './tests/e2e/global/setup.js',
  globalTeardown: './tests/e2e/global/teardown.js',
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['./tests/e2e/global/globals.js'],
  
  // Verbose reporting
  verbose: true,
  
  // Add coverage reporting
  collectCoverage: false,
  
  // Disable cache
  cache: false,
  
  // Don't watch for changes
  watchForChanges: false
};
