const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Custom config for a simpler approach to report failing tests only
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/tests/mocks/ui-setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^./ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^@/ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
  },
  // No coverage
  collectCoverage: false,
  // No noise from passing tests
  silent: true,
  // Use a custom reporter that only shows failures
  reporters: [
    ["default", { "silent": true }],
    ["<rootDir>/scripts/jest-failures-reporter.js"]
  ],
  // Test path patterns to ignore
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
};

module.exports = createJestConfig(customJestConfig);