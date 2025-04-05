import React, { ReactNode } from 'react';

// No need to mock hooks here - we'll do it directly in the test files
// just like the TenantGuard tests do

// Create a simple wrapper for tests
export function TestWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Add a dummy test to satisfy Jest
describe('TestWrapper', () => {
  it('should be defined', () => {
    expect(TestWrapper).toBeDefined();
  });
});
