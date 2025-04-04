// Create a mock function for withAuthentication
export const mockWithAuthentication = jest.fn();

// Mock the middleware module
jest.mock('@/app/api/middleware', () => ({
  withAuthentication: mockWithAuthentication
}));
