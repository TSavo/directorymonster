const nextJest = require('next/jest');
const baseConfig = require('./jest.config.base');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Fix the module mapping for test utilities
const fixedModuleNameMapper = {
  ...baseConfig.moduleNameMapper,
  // Critical fix for @/tests/... imports
  '^@/tests/(.*)$': '<rootDir>/tests/$1',
  // Additional path mappings for better component organization
  '^@components/(.*)$': '<rootDir>/src/components/$1',
  '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  '^@lib/(.*)$': '<rootDir>/src/lib/$1',
  '^@api/(.*)$': '<rootDir>/src/api/$1',
  '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
};

// Specific configurations for different test types
const configs = {
  // Default configuration
  default: {
    displayName: 'Default',
    ...baseConfig,
    // Ensure jsdom environment for React hooks testing
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: [
      ...baseConfig.setupFilesAfterEnv,
      '<rootDir>/tests/mocks/ui-setup.js',
      '<rootDir>/tests/__setup__/global-test-data.js',
      // Add a setup file for React hooks testing
      '<rootDir>/tests/utils/testing-library-hooks-setup.js'
    ],
    // Disable coverage collection by default
    collectCoverage: false,
    // Configuration for JSON output
    verbose: false,
    silent: false,
    maxWorkers: '50%',
    errorOnDeprecated: false,
    testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, '/tests/e2e/'],
    // Use JSON output by default
    json: true,
    // Updated module mappers with fixed @/tests/... path
    moduleNameMapper: fixedModuleNameMapper,
    // Add transform configuration for proper handling of JSX/TSX
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': [
        'babel-jest',
        {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript',
            ['@babel/preset-react', { runtime: 'automatic' }]
          ]
        }
      ]
    },
    globals: {
      __DEV__: true
    }
  },

  // Unit tests configuration
  unit: {
    displayName: 'Unit Tests',
    ...baseConfig,
    testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
    testPathIgnorePatterns: [
      ...baseConfig.testPathIgnorePatterns,
      '/tests/integration/',
      '/tests/e2e/',
    ],
    moduleNameMapper: fixedModuleNameMapper,
  },

  // Integration tests configuration
  integration: {
    displayName: 'Integration Tests',
    ...baseConfig,
    testMatch: ['<rootDir>/tests/integration/**/*.test.{ts,tsx}'],
    testPathIgnorePatterns: [
      ...baseConfig.testPathIgnorePatterns,
      '/tests/e2e/',
    ],
    moduleNameMapper: fixedModuleNameMapper,
  },

  // Component tests configuration
  component: {
    displayName: 'Component Tests',
    ...baseConfig,
    testMatch: ['<rootDir>/src/components/**/*.test.{ts,tsx}'],
    moduleNameMapper: fixedModuleNameMapper,
  },

  // Hook tests configuration
  hook: {
    displayName: 'Hook Tests',
    ...baseConfig,
    testMatch: ['<rootDir>/src/hooks/**/*.test.{ts,tsx}'],
    moduleNameMapper: fixedModuleNameMapper,
  },

  // API tests configuration
  api: {
    displayName: 'API Tests',
    ...baseConfig,
    testMatch: ['<rootDir>/src/app/api/**/*.test.{ts,tsx}'],
    moduleNameMapper: fixedModuleNameMapper,
  },

  // Failures only configuration
  failures: {
    displayName: 'Failures Only',
    ...baseConfig,
    // Add our custom reporter
    reporters: ['./jest-detailed-reporter.js'],
    // Don't show any other output
    verbose: false,
    silent: true,
    moduleNameMapper: fixedModuleNameMapper,
  },
};

// Export the default configuration
module.exports = createJestConfig(configs.default);

// Export specific configurations for different test types
module.exports.unit = createJestConfig(configs.unit);
module.exports.integration = createJestConfig(configs.integration);
module.exports.component = createJestConfig(configs.component);
module.exports.hook = createJestConfig(configs.hook);
module.exports.api = createJestConfig(configs.api);
module.exports.failures = createJestConfig(configs.failures);
