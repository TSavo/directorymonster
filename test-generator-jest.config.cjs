/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: ['<rootDir>/test-generator/tests/HandlebarsEngine.test.cjs'],
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: './coverage-handlebars',
  coverageReporters: ['text', 'lcov'],
};
