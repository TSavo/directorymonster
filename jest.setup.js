// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');
const { enableFetchMocks } = require('jest-fetch-mock');

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
  // Factory function to create a proper mock response
  function createMockResponse(body, init = {}) {
    // First create an actual Response object to inherit from
    const responseInit = {
      status: init.status || 200,
      statusText: init.statusText || 'OK',
      headers: new Headers(init.headers || {})
    };
    
    // Parse the body if needed
    let parsedBody = body;
    if (typeof body === 'object' && body !== null && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
      parsedBody = JSON.stringify(body);
    }
    
    // Create the base response with the correct status code
    const baseResponse = new Response(parsedBody, responseInit);
    
    // Create meta storage for additional properties
    const meta = {
      url: init.url || 'https://test.com',
      originalBody: body,
      init: init
    };
    
    // Create a proxy to handle property access
    return new Proxy(baseResponse, {
      get(target, prop) {
        // Handle special cases
        if (prop === 'clone') {
          return () => createMockResponse(meta.originalBody, meta.init);
        }
        
        // Handle meta properties
        if (prop in meta) {
          return meta[prop];
        }
        
        // Handle status code properly - return from init or from the base response
        if (prop === 'status') {
          return meta.init.status || target.status;
        }
        
        // Handle nextjs-specific methods
        if (prop === 'cookies') {
          return {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            has: jest.fn().mockReturnValue(false),
            getAll: jest.fn().mockReturnValue([])
          };
        }
        
        // Default behavior: return the property/method from the Response object
        const value = target[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        
        return value;
      }
    });
  }
  
  return {
    // Mock NextRequest
    NextRequest: jest.fn().mockImplementation((input, init) => {
      const request = new Request(input || 'https://test.com', init);
      request.nextUrl = new URL(input || 'https://test.com');
      return request;
    }),
    
    // Mock NextResponse
    NextResponse: {
      json: (data, init) => {
        return createMockResponse(data, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {})
          }
        });
      },
      redirect: (url, init) => {
        return createMockResponse(null, {
          ...init,
          status: 302,
          headers: {
            Location: url,
            ...(init?.headers || {})
          }
        });
      },
      next: (init) => {
        return createMockResponse(null, init);
      },
      rewrite: (url, init) => {
        return createMockResponse(null, {
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
  
  // Test various properties and methods
  if (typeof response.json !== 'function') {
    console.error('MOCK ISSUE: NextResponse.json() did not return an object with a json() method');
  } else if (response.status !== 200) {
    console.error('MOCK ISSUE: NextResponse status is not correct');
  } else {
    console.log('NextResponse mock working correctly');
  }
});

// Additional UI component mocks might be needed
// If a component is referenced but not found, add it here
jest.mock('@/ui/button', () => {
  const React = require('react');
  const Button = function Button(props) {
    return React.createElement('button', 
      { 'data-testid': 'mocked-button', ...props }, 
      props.children
    );
  };
  Button.displayName = 'MockedButton';
  return {
    __esModule: true,
    Button,
    default: Button
  };
});