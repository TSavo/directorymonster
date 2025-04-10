const baseConfig = require('./jest.config.base');

// Create a fixed moduleNameMapper configuration
const fixedModuleNameMapper = {
  // Keep all the existing mappings from baseConfig
  ...baseConfig.moduleNameMapper,
  
  // Fix for @/tests paths - this is the critical mapping missing in the original config
  '^@/tests/(.*)$': '<rootDir>/tests/$1',
  
  // Fix for UI component imports
  '^@/components/ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
  '^@/components/ui$': '<rootDir>/tests/mocks/ui',
  
  // Additional component mappings
  '^@/components/(.*)$': '<rootDir>/src/components/$1',
  
  // Context mappings
  '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
  
  // Utility mappings
  '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  
  // Service mappings
  '^@/services/(.*)$': '<rootDir>/src/services/$1',
  
  // Type mappings
  '^@/types/(.*)$': '<rootDir>/src/types/$1',
  
  // Library mappings
  '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  
  // Hook mappings
  '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
};

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
      moduleNameMapper: fixedModuleNameMapper,
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
      moduleNameMapper: fixedModuleNameMapper,
    },
    
    // Component Tests Project
    {
      displayName: 'COMPONENT',
      testMatch: ['<rootDir>/src/components/**/*.test.{ts,tsx}'],
      ...baseConfig,
      moduleNameMapper: fixedModuleNameMapper,
    },
    
    // Hook Tests Project
    {
      displayName: 'HOOK',
      testMatch: ['<rootDir>/src/hooks/**/*.test.{ts,tsx}'],
      ...baseConfig,
      moduleNameMapper: fixedModuleNameMapper,
    },
    
    // API Tests Project
    {
      displayName: 'API',
      testMatch: ['<rootDir>/src/app/api/**/*.test.{ts,tsx}'],
      ...baseConfig,
      moduleNameMapper: fixedModuleNameMapper,
    },
  ],
};
