import { jest } from '@jest/globals';

// Reset all mocks
export function resetAllMocks() {
  jest.resetAllMocks();
  jest.clearAllMocks();
  jest.restoreAllMocks();
}

// Create a mock function with chainable methods
export function createChainableMock<T = any>(defaultValue?: T) {
  const mock = jest.fn().mockReturnValue(defaultValue);
  
  // Add chainable methods
  mock.mockResolvedValue = (value: any) => {
    mock.mockImplementation(() => Promise.resolve(value));
    return mock;
  };
  
  mock.mockRejectedValue = (error: any) => {
    mock.mockImplementation(() => Promise.reject(error));
    return mock;
  };
  
  mock.mockResolvedValueOnce = (value: any) => {
    mock.mockImplementationOnce(() => Promise.resolve(value));
    return mock;
  };
  
  mock.mockRejectedValueOnce = (error: any) => {
    mock.mockImplementationOnce(() => Promise.reject(error));
    return mock;
  };
  
  return mock;
}

// Create a mock event
export function createMockEvent(overrides = {}) {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    ...overrides,
  };
}

// Create a mock form event
export function createMockFormEvent(overrides = {}) {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: {
      elements: {},
      reset: jest.fn(),
    },
    ...overrides,
  };
}

// Create a mock fetch response
export function createMockFetchResponse(body: any, options = {}) {
  const defaults = {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const responseInit = { ...defaults, ...options };
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  
  return new Response(bodyText, responseInit);
}
