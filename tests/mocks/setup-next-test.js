// Global Next.js testing setup
const { setupNextResponseMock } = require('./next/response');
const { setupSecurityMiddlewareMocks, resetSecurityMiddlewareMocks } = require('./next/security-middleware');

// Configure mocks for Next.js testing
function setupNextTesting() {
  // Setup Next.js response mocks
  setupNextResponseMock();
  
  // Setup security middleware mocks
  setupSecurityMiddlewareMocks();
  
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
    resetSecurityMiddlewareMocks();
  });
}

module.exports = {
  setupNextTesting
};