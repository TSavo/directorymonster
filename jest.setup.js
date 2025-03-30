// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { enableFetchMocks } from 'jest-fetch-mock';

// Make sure fetch is defined globally before enabling mocks
if (typeof global.fetch !== 'function') {
  // Using function to create a proper polyfill first
  global.fetch = function fetch() {
    return Promise.resolve({ json: () => Promise.resolve({}) });
  };
}

// Enable fetch mocks for the entire test suite
enableFetchMocks();

// Make sure fetch is properly configured for tests
const fetchMock = require('jest-fetch-mock');
global.fetch = fetchMock;
global.fetch.mockResponse(JSON.stringify({}));

// Properly mock node-fetch for integration tests
jest.mock('node-fetch', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      status: 200,
      headers: new Map()
    });
  });
});

// Mock Next.js headers()
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Additional UI component mocks might be needed
// If a component is referenced but not found, add it here
jest.mock('@/ui/button', () => {
  const Button = ({ children, ...props }) => <button data-testid="mocked-button" {...props}>{children}</button>;
  Button.displayName = 'MockedButton';
  return {
    __esModule: true,
    Button,
    default: Button
  };
});