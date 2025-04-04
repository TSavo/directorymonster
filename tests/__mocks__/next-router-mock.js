// Mock for Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  reload: jest.fn(),
  refresh: jest.fn(),
  forward: jest.fn(),
  pathname: '/test-path',
  route: '/test-path',
  query: {},
  asPath: '/test-path',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isReady: true,
};

// Mock for next/router
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock for next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path',
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn().mockReturnValue(''),
  }),
  useParams: () => ({}),
  // Mock AppRouterContext for App Router
  AppRouterContext: {
    Provider: ({ children }) => children,
    displayName: 'MockedAppRouterContext',
  },
  // Export the router instance for context usage
  appRouter: mockRouter,
}));

// Export the mock router for tests that need to access it directly
module.exports = mockRouter;

// Also export named exports for TypeScript imports
module.exports.useRouter = jest.fn().mockReturnValue(mockRouter);
module.exports.usePathname = jest.fn().mockReturnValue('/test-path');
module.exports.useSearchParams = jest.fn().mockReturnValue({
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  forEach: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  toString: jest.fn().mockReturnValue(''),
});
module.exports.AppRouterContext = {
  Provider: ({ children }) => children,
  displayName: 'MockedAppRouterContext',
};
module.exports.appRouter = mockRouter;
