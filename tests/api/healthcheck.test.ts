/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../../src/app/api/healthcheck/route';

// Mock redis-health module
jest.mock('../../src/lib/redis-health', () => ({
  checkRedisConnection: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

describe('Healthcheck API', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return healthy status when Redis is healthy', async () => {
    // Mock implementation
    const { checkRedisConnection } = require('../../src/lib/redis-health');
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'ok',
      message: 'Redis connection is healthy',
      timestamp: 1000,
    });

    // Set environment variables
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    process.env.NODE_ENV = 'test';

    // Mock Date.now for consistent timestamps
    const originalDate = global.Date;
    const mockISOString = '2023-01-01T00:00:00.000Z';
    global.Date = class extends Date {
      constructor() {
        super();
      }
      toISOString() {
        return mockISOString;
      }
    } as any;

    // Execute the route handler
    const response = await GET();
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'healthy',
      version: '1.0.0',
      environment: 'test',
      timestamp: mockISOString,
      services: {
        redis: {
          status: 'ok',
          message: 'Redis connection is healthy',
          timestamp: 1000,
        },
      },
    });
    
    // Check caching headers
    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    
    // Restore Date
    global.Date = originalDate;
  });

  it('should return unhealthy status when Redis is unhealthy', async () => {
    // Mock implementation
    const { checkRedisConnection } = require('../../src/lib/redis-health');
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Redis connection failed',
      timestamp: 2000,
    });

    // Set environment variables
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    process.env.NODE_ENV = 'test';

    // Mock Date.now for consistent timestamps
    const originalDate = global.Date;
    const mockISOString = '2023-01-01T00:00:00.000Z';
    global.Date = class extends Date {
      constructor() {
        super();
      }
      toISOString() {
        return mockISOString;
      }
    } as any;

    // Execute the route handler
    const response = await GET();
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(503);
    expect(data).toEqual({
      status: 'unhealthy',
      version: '1.0.0',
      environment: 'test',
      timestamp: mockISOString,
      services: {
        redis: {
          status: 'error',
          message: 'Redis connection failed',
          timestamp: 2000,
        },
      },
    });
    
    // Restore Date
    global.Date = originalDate;
  });

  it('should use default values when environment variables are not set', async () => {
    // Mock implementation
    const { checkRedisConnection } = require('../../src/lib/redis-health');
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'ok',
      message: 'Redis connection is healthy',
      timestamp: 1000,
    });

    // Clear environment variables
    delete process.env.NEXT_PUBLIC_APP_VERSION;
    delete process.env.NODE_ENV;

    // Mock Date.now for consistent timestamps
    const originalDate = global.Date;
    const mockISOString = '2023-01-01T00:00:00.000Z';
    global.Date = class extends Date {
      constructor() {
        super();
      }
      toISOString() {
        return mockISOString;
      }
    } as any;

    // Execute the route handler
    const response = await GET();
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'healthy',
      version: '0.1.0', // Default version
      environment: 'development', // Default environment
      timestamp: mockISOString,
      services: {
        redis: {
          status: 'ok',
          message: 'Redis connection is healthy',
          timestamp: 1000,
        },
      },
    });
    
    // Restore Date
    global.Date = originalDate;
  });
});
