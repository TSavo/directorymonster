// Setup for test environment

// Mock fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Reset fetch mock before each test
beforeEach(() => {
  if (typeof global.fetch !== 'undefined' && typeof global.fetch.mockReset === 'function') {
    global.fetch.mockReset();
  }
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
