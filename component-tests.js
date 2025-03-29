/**
 * Component-focused test suite for DirectoryMonster
 * 
 * This script runs only component tests to provide faster feedback
 * on component test coverage and functionality.
 */

// Pattern to match component test files
const componentTestPattern = [
  'tests/components/**/*.test.{ts,tsx}',
  'tests/admin/**/*.test.{ts,tsx}',
  '!tests/admin/**/*.api.test.{ts,tsx}',
  '!tests/admin/**/*.integration.test.{ts,tsx}',
  '!tests/api/**/*.test.{ts,tsx}',
  '!tests/integration/**/*.test.{ts,tsx}',
  '!tests/middleware/**/*.test.{ts,tsx}'
];

// Export configuration for Jest
module.exports = {
  // Use the jest.config.js file as a base
  preset: './jest.config.js',
  // Override only the test pattern to focus on components
  testMatch: componentTestPattern,
  // Collect coverage specifically for component files
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.d.ts',
    '!**/node_modules/**'
  ],
  // Output configuration
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  // Only components directory and admin components
  roots: ['<rootDir>/tests/components', '<rootDir>/tests/admin']
};
