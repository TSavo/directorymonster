/**
 * JWT mock for authentication tests
 */

/**
 * Setup JWT mock for authentication tests
 */
export function setupJwtMock() {
  // Mock the jsonwebtoken library
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockImplementation((token) => {
      if (token === 'valid-token') {
        return { username: 'testuser', role: 'admin' };
      }
      throw new Error('Invalid token');
    }),
  }));
}

/**
 * Reset JWT mock for authentication tests
 */
export function resetJwtMock() {
  const jwt = require('jsonwebtoken');
  
  // Reset the mock implementation
  (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');
  (jwt.verify as jest.Mock).mockImplementation((token) => {
    if (token === 'valid-token') {
      return { username: 'testuser', role: 'admin' };
    }
    throw new Error('Invalid token');
  });
}
