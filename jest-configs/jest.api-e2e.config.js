/**
 * Jest Configuration for API E2E Tests
 * 
 * This configuration is specifically tailored for testing
 * DirectoryMonster API endpoints with end-to-end tests.
 */

module.exports = {
  // Use Node environment since we're testing the API directly
  testEnvironment: 'node',
  
  // Match only API E2E test files
  testMatch: ['**/tests/e2e/api-tests/**/*.test.js'],
  
  // Setup files for global test configuration
  // Note: Create this file if needed for global test setup
  // setupFilesAfterEnv: ['./tests/e2e/api-tests/setup.js'],
  
  // Longer timeout for API tests that may need to seed data
  testTimeout: 30000,
  
  // Detailed output for API tests
  verbose: true,
  
  // Collect coverage specifically for API routes
  collectCoverageFrom: [
    'src/app/api/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Custom reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        pageTitle: 'API E2E Test Report',
        outputPath: './test-results/api-e2e',
        filename: 'index.html',
        expand: true,
      },
    ],
  ],
};
