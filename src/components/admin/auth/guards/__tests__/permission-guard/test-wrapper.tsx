import React, { ReactNode } from 'react';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
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
  }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: jest.fn() }),
}));

// Create a wrapper component that provides all necessary context
export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <>{children}</>
  );
}
