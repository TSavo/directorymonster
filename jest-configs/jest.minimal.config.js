const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  verbose: false,
  silent: true,
  reporters: ['jest-silent-reporter'],
  // Display only minimal information in the console
  // Set to false to suppress all output completely
  silent: false,
  // Prevent console logs from tests
  setupFilesAfterEnv: [
    ...(baseConfig.setupFilesAfterEnv || []),
    '<rootDir>/jest.quiet.setup.js',
  ],
};