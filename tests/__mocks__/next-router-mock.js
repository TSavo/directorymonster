// Mock for Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  reload: jest.fn(),
  forward: jest.fn(),
  pathname: '/test-path',
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
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Export the mock router for tests that need to access it directly
module.exports = mockRouter;
