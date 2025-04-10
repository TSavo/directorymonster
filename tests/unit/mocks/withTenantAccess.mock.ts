// Mock for withTenantAccess middleware
import { NextRequest, NextResponse } from 'next/server';

// Create mock function
export const mockWithTenantAccess = jest.fn().mockImplementation((req, handler) => {
  // Add tenantId to the request as withTenantAccess would do
  const validatedReq = new NextRequest(req.url, {
    headers: req.headers
  });
  
  // Add tenantId property to the request
  Object.defineProperty(validatedReq, 'tenantId', {
    value: req.headers.get('x-tenant-id'),
    writable: true,
    enumerable: true
  });
  
  return handler(validatedReq);
});

// Export the mock module
export default {
  withTenantAccess: mockWithTenantAccess
};
