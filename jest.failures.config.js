module.exports = {
  // Use the project's Jest configuration
  ...require('./jest.config.js'),
  
  // Add our custom reporter
  reporters: ['./jest-failure-reporter.js'],
  
  // Don't show any other output
  verbose: false,
  silent: true
};
