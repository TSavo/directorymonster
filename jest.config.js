const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js', 
    '<rootDir>/tests/mocks/ui-setup.js',
    '<rootDir>/tests/__setup__/global-test-data.js'
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Main app path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    
    // UI component mocks at various relative path depths
    '^../../../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^../ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^./ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
    '^@/ui/(.*)$': '<rootDir>/tests/mocks/ui/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  // Reduce verbosity in test output
  verbose: false,
  silent: false,  // Set to true to suppress console output completely
  maxWorkers: '50%',
  errorOnDeprecated: false,
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  // Customize reporters for less verbose output
  reporters: [
    ['default', { summaryThreshold: 20 }]
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);