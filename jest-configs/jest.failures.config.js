const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Custom config for reporting failing tests only
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
  // Set to false to speed up execution
  collectCoverage: false,
  // Only output minimal information
  verbose: false,
  // Custom reporter to only show failing tests
  reporters: [
    ["jest-silent-reporter", { "showPaths": true, "showWarnings": true, "useDots": false, "showOnlyFailing": true }]
  ],
  // Test path patterns to ignore
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
};

module.exports = createJestConfig(customJestConfig);