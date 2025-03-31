// Standard NextResponse mock implementation
import { NextResponse } from 'next/server';

/**
 * Standardized mock for NextResponse.json
 * Creates responses with proper structure and methods for testing
 */
export const mockNextResponseJson = jest.fn().mockImplementation((body, options = {}) => {
  return {
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: new Headers(options.headers),
    body: Buffer.from(JSON.stringify(body)),
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: jest.fn().mockReturnThis()
  };
});

/**
 * Helper to parse Buffer response bodies in tests
 * 
 * @param response NextResponse object with potential Buffer body
 * @returns Parsed body content as an object
 */
export function parseResponseBody(response: any): any {
  if (response.body instanceof Buffer) {
    try {
      return JSON.parse(Buffer.from(response.body).toString('utf8'));
    } catch (e) {
      return response.body.toString('utf8');
    }
  }
  return response.body;
}

/**
 * Standardized setup for NextResponse mocking
 * This configures Jest to use our mocked implementations
 */
export function setupNextResponseMock(): void {
  jest.mock('next/server', () => {
    const originalModule = jest.requireActual('next/server');
    return {
      ...originalModule,
      NextResponse: {
        ...originalModule.NextResponse,
        json: mockNextResponseJson,
        redirect: jest.fn().mockImplementation((url, init = {}) => {
          return {
            status: init.status || 307,
            headers: new Headers({
              location: url,
              ...(init.headers || {})
            }),
            body: null,
            url
          };
        }),
        next: jest.fn().mockImplementation((init = {}) => {
          return {
            status: 200,
            headers: new Headers(init.headers || {}),
            body: null
          };
        }),
        rewrite: jest.fn().mockImplementation((url, init = {}) => {
          return {
            status: 200,
            headers: new Headers({
              'x-middleware-rewrite': url,
              ...(init.headers || {})
            }),
            body: null,
            url
          };
        })
      }
    };
  });
}

export { NextResponse };