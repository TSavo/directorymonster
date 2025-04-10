// Import the Next.js Jest configuration and base config
const nextJest = require('next/jest');
const baseConfig = require('./jest.config.base');

// Create a Next.js Jest configuration
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  ...baseConfig,

  // Exclude e2e tests to focus on component and unit tests
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns,
    '/tests/e2e/',
    '/tests/integration/',
    '/tests/admin/integration/'
  ],

  // Add our custom reporter
  reporters: ['./jest-detailed-reporter.js'],

  // Don't show any other output
  verbose: false,
  silent: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
