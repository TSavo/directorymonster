'use client';

// Mock implementation of useTenant for testing
export const useTenant = jest.fn().mockReturnValue({
  tenant: { id: 'tenant-456', name: 'Test Tenant' },
  loading: false,
  error: null,
  setTenant: jest.fn()
});

export default useTenant;