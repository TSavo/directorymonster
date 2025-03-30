/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock these modules before importing the route
jest.mock('../../src/lib/redis-health', () => ({
  checkRedisConnection: jest.fn()
}));

// Now import the route after the mocks are set up
import { GET } from '../../src/app/api/healthcheck/route';

// Get a reference to the mocked module
const redisHealth = require('../../src/lib/redis-health');

// We'll define our test data here
const mockRedisStatusHealthy = {
  status: 'ok',
  message: 'Redis connection is healthy',
  connectionState: 'connected',
  timestamp: 1000,
};

const mockRedisStatusUnhealthy = {
  status: 'error',
  message: 'Redis connection failed',
  connectionState: 'disconnected',
  timestamp: 2000,
};

// Mock environment variables
const originalEnv = process.env;

describe('Healthcheck API', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();

    // Reset the redis-health mock default
    redisHealth.checkRedisConnection.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return healthy status when Redis is healthy', async () => {
    // Set up mock to return healthy status
    redisHealth.checkRedisConnection.mockResolvedValue(mockRedisStatusHealthy);

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
    
    // Verify the response data matches expected
    expect(data).toEqual({
      status: 'healthy',
      version: '1.0.0',
      environment: 'test',
      timestamp: mockISOString,
      message: 'Hot reloading is confirmed working! Changes are detected without rebuilding.',
      services: {
        redis: mockRedisStatusHealthy,
      },
    });
    
    // Restore Date
    global.Date = originalDate;
  });

  it('should return unhealthy status when Redis is unhealthy', async () => {
    // Set up unhealthy Redis mock
    redisHealth.checkRedisConnection.mockResolvedValue(mockRedisStatusUnhealthy);

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
    
    // Verify unhealthy response data without checking response.status
    expect(data).toEqual({
      status: 'unhealthy',
      version: '1.0.0',
      environment: 'test',
      timestamp: mockISOString,
      message: 'Hot reloading is confirmed working! Changes are detected without rebuilding.',
      services: {
        redis: mockRedisStatusUnhealthy,
      },
    });
    
    // Restore Date
    global.Date = originalDate;
  });

  it('should use default values when environment variables are not set', async () => {
    // Set up healthy Redis mock
    redisHealth.checkRedisConnection.mockResolvedValue(mockRedisStatusHealthy);

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
    
    // Verify the response uses default values
    expect(data).toEqual({
      status: 'healthy',
      version: '0.1.0', // Default version
      environment: 'development', // Default environment
      timestamp: mockISOString,
      message: 'Hot reloading is confirmed working! Changes are detected without rebuilding.',
      services: {
        redis: mockRedisStatusHealthy,
      },
    });
    
    // Restore Date
    global.Date = originalDate;
  });
});
