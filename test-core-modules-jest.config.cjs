/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: ['<rootDir>/test-generator/tests/core-modules.test.js'],
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: './coverage-core-modules',
  coverageReporters: ['text', 'lcov'],
};
