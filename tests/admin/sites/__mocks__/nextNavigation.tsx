/**
 * Mock implementation for Next.js navigation module
 * This provides a consistent mock for the useRouter hook across all tests
 */

// Create a mock router object
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/admin/sites',
  query: {},
};

// Export mock useRouter function
export const useRouter = jest.fn(() => mockRouter);

// Export mock usePathname function
export const usePathname = jest.fn(() => '/admin/sites');

// Export mock useSearchParams function
export const useSearchParams = jest.fn(() => new URLSearchParams());

// Reset all mocks
export const resetMocks = () => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.refresh.mockReset();
  mockRouter.prefetch.mockReset();
  useRouter.mockReset();
  useRouter.mockImplementation(() => mockRouter);
  usePathname.mockReset();
  usePathname.mockImplementation(() => '/admin/sites');
  useSearchParams.mockReset();
  useSearchParams.mockImplementation(() => new URLSearchParams());
};
