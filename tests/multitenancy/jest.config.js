// Next.js Jest config
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: '../../',
});

const customJestConfig = {
  setupFiles: ['<rootDir>/setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
  },
  testTimeout: 10000, // Increased timeout for Redis operations
};

module.exports = createJestConfig(customJestConfig);