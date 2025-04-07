// Import the Next.js Jest configuration
const nextJest = require('next/jest');

// Create a Next.js Jest configuration
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Use the same setup files as the main Jest configuration
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/tests/mocks/ui-setup.js',
    '<rootDir>/tests/__setup__/global-test-data.js'
  ],
  testEnvironment: 'jest-environment-jsdom',

  // Exclude e2e tests to focus on component and unit tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/tests/e2e/',
    '/tests/integration/',
    '/tests/admin/integration/'
  ],

  // Add our custom reporter
  reporters: ['./jest-detailed-reporter.js'],

  // Don't show any other output
  verbose: false,
  silent: true,

  // Use the same module name mapper as the main Jest configuration
  moduleNameMapper: {
    // Main app path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',

    // UI component mocks at various relative path depths
    '^../../../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^./ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^@/ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',

    // Mock snarkjs
    '^snarkjs$': '<rootDir>/tests/__mocks__/snarkjs.js',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
