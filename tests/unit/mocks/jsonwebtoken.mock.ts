// Mock for jsonwebtoken
export const mockVerify = jest.fn().mockImplementation((token, secret) => {
  // Always return a valid token payload for testing
  return {
    userId: 'user-123',
    exp: Math.floor(Date.now() / 1000) + 3600
  };
});

// Export the mock module
export default {
  verify: mockVerify,
  sign: jest.fn().mockReturnValue('mock-token'),
  decode: jest.fn().mockReturnValue({ userId: 'user-123' })
};
