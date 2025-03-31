import { ReactNode } from 'react';

// Create a more detailed mock for Next.js app router
const mockRouter = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

export const useRouter = jest.fn().mockReturnValue(mockRouter);
export const usePathname = jest.fn().mockReturnValue('/');
export const useSearchParams = jest.fn().mockReturnValue({ get: jest.fn() });

// Mock the AppRouter context provider
export const AppRouterContext = {
  Provider: ({ children, value }: { children: ReactNode; value?: any }) => children,
  displayName: 'MockedAppRouterContext',
};

// Export a router instance that can be used in the context
export const appRouter = mockRouter;
