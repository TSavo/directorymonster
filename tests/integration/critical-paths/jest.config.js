const { defaults } = require('jest-config');

module.exports = {
  ...defaults,
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
  },
  rootDir: './',
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
};
