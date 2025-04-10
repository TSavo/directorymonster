import { NextRequest, NextResponse } from 'next/server';
import { Headers } from 'next/dist/compiled/@edge-runtime/primitives/fetch';

// Create a mock NextRequest
export function createMockRequest({
  method = 'GET',
  url = 'http://localhost:3000',
  headers = {},
  cookies = {},
  body = null,
}: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
} = {}): NextRequest {
  // Create headers
  const headersObj = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headersObj.set(key, value);
  });
  
  // Create cookies
  const cookiesObj = {
    get: jest.fn().mockImplementation((name: string) => {
      return cookies[name] || null;
    }),
    getAll: jest.fn().mockImplementation(() => {
      return Object.entries(cookies).map(([name, value]) => ({ name, value }));
    }),
    has: jest.fn().mockImplementation((name: string) => {
      return name in cookies;
    }),
    set: jest.fn(),
    delete: jest.fn(),
  };
  
  // Create URL object
  const urlObj = new URL(url);
  
  // Create request init
  const init: RequestInit = {
    method,
    headers: headersObj,
  };
  
  // Add body if provided
  if (body) {
    if (typeof body === 'object') {
      init.body = JSON.stringify(body);
    } else {
      init.body = body;
    }
  }
  
  // Create request
  const request = new Request(url, init) as NextRequest;
  
  // Add Next.js specific properties
  Object.defineProperty(request, 'cookies', {
    value: cookiesObj,
    writable: true,
  });
  
  Object.defineProperty(request, 'nextUrl', {
    value: urlObj,
    writable: true,
  });
  
  // Add json method if not present
  if (!request.json) {
    request.json = async () => {
      if (!body) return {};
      return typeof body === 'object' ? body : JSON.parse(body);
    };
  }
  
  return request;
}

// Parse response body
export async function parseResponseBody(response: NextResponse): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

// Create a test database
export function createTestDatabase() {
  const db = new Map<string, any>();
  
  return {
    get: jest.fn().mockImplementation((key: string) => {
      return db.get(key);
    }),
    set: jest.fn().mockImplementation((key: string, value: any) => {
      db.set(key, value);
      return true;
    }),
    delete: jest.fn().mockImplementation((key: string) => {
      return db.delete(key);
    }),
    has: jest.fn().mockImplementation((key: string) => {
      return db.has(key);
    }),
    clear: jest.fn().mockImplementation(() => {
      db.clear();
    }),
    size: jest.fn().mockImplementation(() => {
      return db.size;
    }),
    getAll: jest.fn().mockImplementation(() => {
      return Array.from(db.entries());
    }),
  };
}
