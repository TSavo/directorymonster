// Create a mock function for middleware
export const mockMiddleware = jest.fn();

// Mock the middleware module
jest.mock('@/middleware', () => ({
  middleware: mockMiddleware
}));
