import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Options for creating a mock request
 */
export interface MockRequestOptions {
  /**
   * The HTTP method
   * @default 'GET'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * The request headers
   */
  headers?: Record<string, string>;
  
  /**
   * The request body
   */
  body?: any;
  
  /**
   * The request query parameters
   */
  query?: Record<string, string>;
  
  /**
   * The request cookies
   */
  cookies?: Record<string, string>;
  
  /**
   * The request URL
   * @default 'http://localhost'
   */
  url?: string;
}

/**
 * Create a mock Next.js request
 * 
 * @param options Request options
 * @returns A mock Next.js request
 */
export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    headers = {},
    body = null,
    query = {},
    cookies = {},
    url = 'http://localhost'
  } = options;
  
  // Create URL with query parameters
  const urlWithQuery = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    urlWithQuery.searchParams.append(key, value);
  });
  
  // Create headers
  const headersObj = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headersObj.append(key, value);
  });
  
  // Create request
  const request = new NextRequest(urlWithQuery, {
    method,
    headers: headersObj,
    body: body ? JSON.stringify(body) : null
  });
  
  // Add cookies
  Object.entries(cookies).forEach(([key, value]) => {
    // This is a simplified implementation
    // In a real implementation, you would need to add cookies to the request
  });
  
  return request;
}

/**
 * Parse a Next.js response
 * 
 * @param response The Next.js response
 * @returns The parsed response
 */
export async function parseResponse(response: NextResponse): Promise<{
  status: number;
  headers: Record<string, string>;
  body: any;
}> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    // Response body is not JSON
    body = await response.text();
  }
  
  return {
    status: response.status,
    headers,
    body
  };
}

/**
 * Test a Next.js API route handler
 * 
 * @param handler The API route handler
 * @param request The request to test
 * @returns The parsed response
 */
export async function testApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  request: NextRequest
): Promise<{
  status: number;
  headers: Record<string, string>;
  body: any;
}> {
  const response = await handler(request);
  return parseResponse(response);
}

/**
 * Create a mock context for API route handlers
 * 
 * @param params Route parameters
 * @returns A mock context
 */
export function createMockContext(params: Record<string, string> = {}): {
  params: Record<string, string>;
} {
  return { params };
}

/**
 * Create a mock database client for testing
 * 
 * @param mockData The mock data to return
 * @returns A mock database client
 */
export function createMockDbClient(mockData: Record<string, any> = {}): any {
  return {
    query: jest.fn().mockImplementation((sql: string) => {
      // This is a simplified implementation
      // In a real implementation, you would need to parse the SQL query
      // and return the appropriate data
      return Promise.resolve({ rows: mockData.rows || [] });
    }),
    
    transaction: jest.fn().mockImplementation((callback: (client: any) => Promise<any>) => {
      return callback({
        query: jest.fn().mockImplementation((sql: string) => {
          return Promise.resolve({ rows: mockData.rows || [] });
        })
      });
    })
  };
}

/**
 * Create a mock Redis client for testing
 * 
 * @param mockData The mock data to return
 * @returns A mock Redis client
 */
export function createMockRedisClient(mockData: Record<string, any> = {}): any {
  const store: Record<string, any> = { ...mockData };
  
  return {
    get: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(store[key] || null);
    }),
    
    set: jest.fn().mockImplementation((key: string, value: any) => {
      store[key] = value;
      return Promise.resolve('OK');
    }),
    
    del: jest.fn().mockImplementation((key: string) => {
      delete store[key];
      return Promise.resolve(1);
    }),
    
    hget: jest.fn().mockImplementation((key: string, field: string) => {
      return Promise.resolve((store[key] || {})[field] || null);
    }),
    
    hset: jest.fn().mockImplementation((key: string, field: string, value: any) => {
      store[key] = store[key] || {};
      store[key][field] = value;
      return Promise.resolve(1);
    }),
    
    hdel: jest.fn().mockImplementation((key: string, field: string) => {
      if (store[key]) {
        delete store[key][field];
      }
      return Promise.resolve(1);
    })
  };
}
