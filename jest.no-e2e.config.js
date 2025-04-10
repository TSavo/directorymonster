module.exports = {
  // Use the project's Jest configuration
  ...require('./jest.config.js'),
  
  // Exclude e2e tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/integration/',
    '/tests/admin/integration/'
  ],
  
  // Add our custom reporter
  reporters: ['./jest-failure-reporter.js'],
  
  // Don't show any other output
  verbose: false,
  silent: true
};
