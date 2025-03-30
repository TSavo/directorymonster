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

// Mock Next.js headers() and NextResponse
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Mock NextResponse for API routes
jest.mock('next/server', () => {
  // Use a standard Response class with json method for mocking
  class EnhancedResponse extends Response {
    constructor(body, init) {
      super(body, init);
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers || {});
      
      // Store the original data for the json() method
      this._data = null;
    }
    
    // Add json() method that returns the data
    json() {
      if (this._data) {
        return Promise.resolve(this._data);
      }
      
      return super.json();
    }
  }
  
  return {
    NextRequest: jest.fn().mockImplementation((input, init) => {
      const request = new Request(input || 'https://test.com', init);
      request.nextUrl = new URL(input || 'https://test.com');
      return request;
    }),
    NextResponse: {
      json: (data, init) => {
        const jsonString = JSON.stringify(data);
        const response = new EnhancedResponse(jsonString, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {})
          }
        });
        
        // Store the original data
        response._data = data;
        
        return response;
      },
      redirect: (url, init) => {
        return new EnhancedResponse(null, {
          ...init,
          status: 302,
          headers: {
            Location: url,
            ...(init?.headers || {})
          }
        });
      },
      next: (init) => {
        return new EnhancedResponse(null, init);
      },
      rewrite: (url, init) => {
        return new EnhancedResponse(null, {
          ...init,
          headers: {
            'x-middleware-rewrite': url,
            ...(init?.headers || {})
          }
        });
      }
    }
  };
});

// Write a test for NextResponse mock
afterAll(() => {
  // Verify that our NextResponse mock works
  const { NextResponse } = require('next/server');
  const responseObj = { test: 'data' };
  const response = NextResponse.json(responseObj);
  
  if (typeof response.json !== 'function') {
    console.error('MOCK ISSUE: NextResponse.json() did not return an object with a json() method');
  } else {
    console.log('NextResponse mock working correctly');
  }
});

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