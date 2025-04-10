// Base Jest configuration for all test types
const baseConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Main app path aliases
    '^@/(.*)$': '<rootDir>/src/$1',

    // UI component mocks - only mock specific components, not all
    '^@/components/ui/dialog$': '<rootDir>/tests/mocks/components/ui/Dialog.tsx',
    '^@/components/ui/button$': '<rootDir>/tests/mocks/components/ui/Button.tsx',
    '^@/components/ui/input$': '<rootDir>/tests/mocks/components/ui/Input.tsx',
    '^@/components/ui/checkbox$': '<rootDir>/tests/mocks/components/ui/Checkbox.tsx',
    '^@/components/ui/select$': '<rootDir>/tests/mocks/components/ui/Select.tsx',

    // Admin component mocks - only mock specific components, not all
    '^@/components/admin/auth/hooks/useAuth$': '<rootDir>/tests/mocks/components/admin/auth/hooks/useAuth.ts',
    '^@/components/admin/users/UserRoleManager$': '<rootDir>/tests/mocks/components/admin/users/UserRoleManager.tsx',

    // Context mocks
    '^@/contexts/PublicTenantSiteContext$': '<rootDir>/tests/mocks/contexts/PublicTenantSiteContext.tsx',

    // Component mocks
    '^@/components/SearchBar$': '<rootDir>/tests/mocks/components/SearchBar.tsx',
    '^@/components/auth$': '<rootDir>/tests/mocks/components/auth/index.ts',

    // Hook mocks
    '^@/hooks/(.*)$': '<rootDir>/tests/mocks/hooks/$1',

    // Service mocks
    '^@/services/(.*)$': '<rootDir>/tests/mocks/services/$1',

    // Utility mocks
    '^@/utils/(.*)$': '<rootDir>/tests/mocks/utils/$1',

    // Next.js mocks
    '^next/(.*)$': '<rootDir>/tests/mocks/next/$1',

    // Other specific mocks
    '^snarkjs$': '<rootDir>/tests/__mocks__/snarkjs.js',
    '^react-hook-form$': '<rootDir>/tests/__mocks__/react-hook-form.js',
    '^@hookform/resolvers/zod$': '<rootDir>/tests/__mocks__/@hookform/resolvers/zod.js',
    '^zod$': '<rootDir>/tests/__mocks__/zod.js',
    '^lucide-react$': '<rootDir>/tests/mocks/ui/icons.tsx',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@hookform|zod|snarkjs)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
};

module.exports = baseConfig;
