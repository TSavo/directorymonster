const baseConfig = require('./jest.config.base');

// Define project configurations
module.exports = {
  projects: [
    // Unit Tests Project
    {
      displayName: 'UNIT',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/tests/integration/',
        '/tests/e2e/',
      ],
      ...baseConfig,
    },
    
    // Integration Tests Project
    {
      displayName: 'INTEGRATION',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/tests/e2e/',
      ],
      ...baseConfig,
    },
    
    // Component Tests Project
    {
      displayName: 'COMPONENT',
      testMatch: ['<rootDir>/src/components/**/*.test.{ts,tsx}'],
      ...baseConfig,
    },
    
    // Hook Tests Project
    {
      displayName: 'HOOK',
      testMatch: ['<rootDir>/src/hooks/**/*.test.{ts,tsx}'],
      ...baseConfig,
    },
    
    // API Tests Project
    {
      displayName: 'API',
      testMatch: ['<rootDir>/src/app/api/**/*.test.{ts,tsx}'],
      ...baseConfig,
    },
  ],
};
