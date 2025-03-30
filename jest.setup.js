// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { enableFetchMocks } from 'jest-fetch-mock';

// TextEncoder/TextDecoder polyfill for node environments
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Ensure fetch is available globally - Node.js v22 already has it natively
// but Jest JSDOM environment might not
if (typeof global.fetch !== 'function') {
  // First try Node's native fetch if available
  try {
    const nodeFetch = require('node-fetch');
    global.fetch = nodeFetch.default || nodeFetch;
  } catch (e) {
    // Fallback to a simple mock implementation
    global.fetch = function fetch() {
      return Promise.resolve({ 
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        ok: true
      });
    };
  }
}

// Initialize and configure fetch-mock
enableFetchMocks();
const fetchMock = require('jest-fetch-mock');
global.fetch = fetchMock;
global.fetch.mockResponse(JSON.stringify({}));

// Mock node-fetch for any explicit imports
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