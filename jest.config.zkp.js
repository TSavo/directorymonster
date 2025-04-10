/**
 * Jest configuration for Zero-Knowledge Proof (ZKP) tests
 *
 * This configuration is specifically designed for running ZKP-related tests,
 * which have special requirements and may need to execute actual ZKP operations.
 */

const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  // Only run tests in the crypto directory and ZKP-related tests in lib
  testMatch: [
    '<rootDir>/tests/crypto/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/tests/lib/zkp*.test.{ts,tsx,js,jsx}',
    '<rootDir>/src/lib/zkp/**/*.test.{ts,tsx,js,jsx}'
  ],

  // Set a longer timeout for ZKP tests since they can be computationally intensive
  testTimeout: 60000,

  // Use a specific setup file for ZKP tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/crypto/zkp-test-setup.js'
  ],

  // Environment variables specific to ZKP tests
  testEnvironment: 'node',

  // Use a custom reporter that shows more details about ZKP operations
  reporters: ['default'],

  // Don't run these tests in watch mode by default
  watchPathIgnorePatterns: ['<rootDir>/circuits/'],

  // Skip coverage collection for ZKP tests by default
  collectCoverage: false,

  // Add specific module name mappers for ZKP tests
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Use mock implementation when ZKP_USE_MOCKS is set
    '^snarkjs$': process.env.ZKP_USE_MOCKS
      ? '<rootDir>/tests/__mocks__/snarkjs.js'
      : '<rootDir>/node_modules/snarkjs'
  }
};
