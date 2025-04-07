module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/integration-tests/**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/components/admin/users/**/*.{ts,tsx}',
    'src/components/admin/permissions/**/*.{ts,tsx}',
    'src/app/api/admin/users/**/*.{ts,tsx}',
    'src/app/api/admin/permissions/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
