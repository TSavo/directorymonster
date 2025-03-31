// Standard NextRequest mock implementation
import { NextRequest } from 'next/server';

/**
 * Creates a standardized mock NextRequest for testing
 * 
 * @param options Configuration options for the mock request
 * @returns A mock NextRequest object
 */
export function createMockNextRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  searchParams?: Record<string, string>;
} = {}): NextRequest {
  // Create headers with Map-like interface
  const headers = new Map<string, string>();
  
  // Add default and custom headers
  headers.set('x-tenant-id', options.headers?.['x-tenant-id'] || 'test-tenant-id');
  headers.set('authorization', options.headers?.['authorization'] || 'Bearer test-token');
  
  // Add any additional custom headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (key !== 'x-tenant-id' && key !== 'authorization') {
        headers.set(key, value);
      }
    });
  }

  // Create search params with Map-like interface
  const searchParams = new Map<string, string>();
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
  }

  // Create the mock request
  return {
    url: options.url || 'https://test.directorymonster.com/api/test',
    method: options.method || 'GET',
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()),
      has: (name: string) => headers.has(name.toLowerCase()),
      set: (name: string, value: string) => headers.set(name.toLowerCase(), value),
      forEach: (callback: (value: string, key: string) => void) => {
        headers.forEach((value, key) => callback(value, key));
      }
    } as Headers,
    nextUrl: {
      pathname: new URL(options.url || 'https://test.directorymonster.com/api/test').pathname,
      searchParams: {
        get: (key: string) => searchParams.get(key),
        has: (key: string) => searchParams.has(key),
        forEach: (callback: (value: string, key: string) => void) => {
          searchParams.forEach((value, key) => callback(value, key));
        }
      } as URLSearchParams,
      hostname: new URL(options.url || 'https://test.directorymonster.com/api/test').hostname
    },
    clone: jest.fn().mockReturnValue({
      json: jest.fn().mockResolvedValue(options.body || {})
    }),
    json: jest.fn().mockResolvedValue(options.body || {})
  } as unknown as NextRequest;
}