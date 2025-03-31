# DirectoryMonster Mocking Specification

## Overview

This document defines standardized approaches for mocking key dependencies in the DirectoryMonster project, specifically NextJS components and Redis interactions. Following these patterns will ensure test consistency and reliability across the project.

## NextJS Mocking Standards

### 1. NextRequest and NextResponse

When mocking Next.js Request and Response objects, follow these standardized approaches:

```typescript
// Standard NextRequest mock
function createMockNextRequest(options: {
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
      get: (name: string) => headers.get(name),
      has: (name: string) => headers.has(name),
      set: (name: string, value: string) => headers.set(name, value)
    },
    nextUrl: {
      pathname: new URL(options.url || 'https://test.directorymonster.com/api/test').pathname,
      searchParams: {
        get: (key: string) => searchParams.get(key),
        has: (key: string) => searchParams.has(key)
      },
      hostname: new URL(options.url || 'https://test.directorymonster.com/api/test').hostname
    },
    clone: jest.fn().mockReturnValue({
      json: jest.fn().mockResolvedValue(options.body || {})
    }),
    json: jest.fn().mockResolvedValue(options.body || {})
  } as unknown as NextRequest;
}

// Standard NextResponse mock and helpers
const mockNextResponseJson = jest.fn().mockImplementation((body, options = {}) => {
  return {
    status: options.status || 200,
    headers: new Headers(options.headers),
    body: Buffer.from(JSON.stringify(body)),
    json: async () => body
  };
});

// Helper to parse Buffer response bodies
function parseResponseBody(response: any): any {
  if (response.body instanceof Buffer) {
    return JSON.parse(Buffer.from(response.body).toString('utf8'));
  }
  return response.body;
}

// Mock Next.js modules
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: mockNextResponseJson
    }
  };
});
```

### 2. NextJS Middleware Mocking

For middleware functions, use this standardized pattern:

```typescript
// Control variables for middleware behavior
let middlewareResponseStatus = 200;
let middlewareResponseBody = { success: true };
let middlewareShouldPass = true;

// Standard middleware mock
jest.mock('@/middleware/example-middleware', () => ({
  withSomeMiddleware: jest.fn().mockImplementation(async (req, handler) => {
    // Use control variables to determine middleware behavior
    if (!middlewareShouldPass) {
      return mockNextResponseJson(
        middlewareResponseBody,
        { status: middlewareResponseStatus }
      );
    }
    
    // Successful middleware execution passes to handler
    return handler(req);
  })
}));

// Reset middleware mocks between tests
beforeEach(() => {
  middlewareResponseStatus = 200;
  middlewareResponseBody = { success: true };
  middlewareShouldPass = true;
});

// Example test with middleware rejection
it('should handle middleware rejection', async () => {
  // Configure middleware to reject
  middlewareShouldPass = false;
  middlewareResponseStatus = 403;
  middlewareResponseBody = { error: 'Access denied' };
  
  // Test with middleware rejection
  const response = await yourFunction();
  expect(response.status).toBe(403);
  expect(parseResponseBody(response)).toEqual({ error: 'Access denied' });
});
```

### 3. Security Middleware Mocking

For security-specific middleware, use this enhanced pattern:

```typescript
// Mock TenantContext class
class MockTenantContext {
  tenantId: string;
  userId: string;
  requestId: string;
  timestamp: number;
  
  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.requestId = 'test-request-id';
    this.timestamp = Date.now();
  }
  
  static async fromRequest(req: any): Promise<MockTenantContext | null> {
    // Allow tests to control whether context creation succeeds
    if (!securityContextShouldSucceed) {
      return null;
    }
    return new MockTenantContext(
      contextTenantId || req.headers.get('x-tenant-id') || 'default-tenant',
      contextUserId || 'default-user'
    );
  }
}

// Control variables for security middleware
let securityContextShouldSucceed = true;
let contextTenantId = 'test-tenant-id';
let contextUserId = 'test-user-id';
let securityResponseStatus = 200;
let securityResponseBody = { success: true };

// Mock security middleware
jest.mock('@/app/api/middleware/secureTenantContext', () => ({
  TenantContext: MockTenantContext,
  
  withSecureTenantContext: jest.fn().mockImplementation(async (req, handler) => {
    const context = await MockTenantContext.fromRequest(req);
    
    if (!context) {
      return mockNextResponseJson(
        { error: 'Unauthorized', message: 'Invalid tenant context' },
        { status: 401 }
      );
    }
    
    // Allow tests to force specific responses
    if (securityResponseStatus !== 200) {
      return mockNextResponseJson(
        securityResponseBody,
        { status: securityResponseStatus }
      );
    }
    
    return handler(req, context);
  }),
  
  withSecureTenantPermission: jest.fn().mockImplementation(
    async (req, resourceType, permission, handler, resourceId) => {
      const context = await MockTenantContext.fromRequest(req);
      
      if (!context) {
        return mockNextResponseJson(
          { error: 'Unauthorized', message: 'Invalid tenant context' },
          { status: 401 }
        );
      }
      
      // Check permissions using mocked RoleService
      const hasPermission = await mockRoleService.hasPermission(
        context.userId,
        context.tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      if (!hasPermission) {
        return mockNextResponseJson(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
      
      // Allow tests to force specific responses
      if (securityResponseStatus !== 200) {
        return mockNextResponseJson(
          securityResponseBody,
          { status: securityResponseStatus }
        );
      }
      
      return handler(req, context);
    }
  )
}));

// Reset security mocks between tests
beforeEach(() => {
  securityContextShouldSucceed = true;
  contextTenantId = 'test-tenant-id';
  contextUserId = 'test-user-id';
  securityResponseStatus = 200;
  securityResponseBody = { success: true };
  mockRoleService.hasPermission.mockResolvedValue(true);
});
```

## Redis Mocking Standards

### 1. Standard Redis Client Mock

```typescript
// Mock in-memory Redis store
const mockRedisStore = new Map<string, string>();

// Standard Redis client mock
const mockRedisClient = {
  get: jest.fn().mockImplementation((key: string) => {
    return Promise.resolve(mockRedisStore.get(key) || null);
  }),
  
  set: jest.fn().mockImplementation((key: string, value: string, options?: any) => {
    mockRedisStore.set(key, value);
    return Promise.resolve('OK');
  }),
  
  del: jest.fn().mockImplementation((key: string) => {
    if (mockRedisStore.has(key)) {
      mockRedisStore.delete(key);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  }),
  
  keys: jest.fn().mockImplementation((pattern: string) => {
    const result: string[] = [];
    mockRedisStore.forEach((_, key) => {
      if (key.startsWith(pattern.replace('*', ''))) {
        result.push(key);
      }
    });
    return Promise.resolve(result);
  }),
  
  hmset: jest.fn().mockImplementation((key: string, ...args: any[]) => {
    const obj: any = {};
    for (let i = 0; i < args.length; i += 2) {
      obj[args[i]] = args[i + 1];
    }
    mockRedisStore.set(key, JSON.stringify(obj));
    return Promise.resolve('OK');
  }),
  
  hgetall: jest.fn().mockImplementation((key: string) => {
    const value = mockRedisStore.get(key);
    if (!value) return Promise.resolve(null);
    try {
      return Promise.resolve(JSON.parse(value));
    } catch (e) {
      return Promise.resolve({});
    }
  }),
  
  // Add additional Redis methods as needed
  
  // Utility methods for testing
  _clear: () => {
    mockRedisStore.clear();
  },
  
  _set: (key: string, value: any) => {
    mockRedisStore.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  },
  
  _getAll: () => {
    const result: Record<string, any> = {};
    mockRedisStore.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
};

// Mock Redis client module
jest.mock('@/lib/redis-client', () => ({
  __esModule: true,
  default: {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
    inMemoryFallback: true
  }
}));

// Reset Redis store between tests
beforeEach(() => {
  mockRedisStore.clear();
  Object.values(mockRedisClient).forEach(method => {
    if (jest.isMockFunction(method)) {
      method.mockClear();
    }
  });
});
```

### 2. Testing with Redis Namespacing

For tenant-namespaced Redis operations:

```typescript
// Standard Redis namespacing helper
function getNamespacedKey(key: string, tenantId: string): string {
  return `tenant:${tenantId}:${key}`;
}

// Setup tenant data in Redis
function setupTenantData(tenantId: string, data: Record<string, any>) {
  Object.entries(data).forEach(([key, value]) => {
    const namespacedKey = getNamespacedKey(key, tenantId);
    mockRedisClient._set(namespacedKey, value);
  });
}

// Test Redis namespacing
it('should use namespaced Redis keys', async () => {
  // Setup
  const tenantId = 'test-tenant';
  setupTenantData(tenantId, {
    'user:123': JSON.stringify({ name: 'Test User' })
  });
  
  // Execute function that uses Redis
  const result = await getUserData('123', tenantId);
  
  // Verify
  expect(mockRedisClient.get).toHaveBeenCalledWith(
    getNamespacedKey('user:123', tenantId)
  );
  expect(result).toEqual({ name: 'Test User' });
});
```

## Integration Testing with Multiple Dependencies

When testing code that depends on both NextJS and Redis:

```typescript
// Setup mocks for both NextJS and Redis
const setupIntegrationTest = async (options: {
  tenantId?: string;
  userId?: string;
  redisData?: Record<string, any>;
  shouldPassSecurity?: boolean;
} = {}) => {
  // Set default options
  const tenantId = options.tenantId || 'test-tenant';
  const userId = options.userId || 'test-user';
  const shouldPassSecurity = options.shouldPassSecurity ?? true;
  
  // Setup security middleware
  securityContextShouldSucceed = shouldPassSecurity;
  contextTenantId = tenantId;
  contextUserId = userId;
  
  // Setup Redis data
  if (options.redisData) {
    setupTenantData(tenantId, options.redisData);
  }
  
  // Create test request
  const request = createMockNextRequest({
    headers: {
      'x-tenant-id': tenantId,
      'authorization': 'Bearer test-token'
    }
  });
  
  return { request, tenantId, userId };
};

// Example integration test
it('should handle API route with Redis data', async () => {
  // Setup test environment
  const { request, tenantId } = await setupIntegrationTest({
    redisData: {
      'settings': JSON.stringify({ featureEnabled: true })
    }
  });
  
  // Create API route handler
  const handler = async (req: NextRequest) => {
    return withSecureTenantContext(req, async (req, context) => {
      // Get data from Redis
      const redisClient = await getRedisClient();
      const settingsKey = getNamespacedKey('settings', context.tenantId);
      const settingsData = await redisClient.get(settingsKey);
      
      // Return response
      return NextResponse.json({
        success: true,
        settings: settingsData ? JSON.parse(settingsData) : null
      });
    });
  };
  
  // Execute API route
  const response = await handler(request);
  
  // Verify results
  expect(response.status).toBe(200);
  expect(parseResponseBody(response)).toEqual({
    success: true,
    settings: { featureEnabled: true }
  });
  
  // Verify Redis interaction
  expect(mockRedisClient.get).toHaveBeenCalledWith(
    getNamespacedKey('settings', tenantId)
  );
});
```

## Best Practices for Test Organization

1. **Maintain Consistent Setup**
   - Use the standardized mocking patterns in all test files
   - Create helper functions for common setup tasks
   - Reset all mocks in beforeEach() hooks

2. **Group Related Tests**
   - Organize tests by functionality, not by dependency
   - Use nested describe blocks for different scenarios
   - Keep all mocking setup at the top of the file

3. **Test Independence**
   - Ensure each test is independent and can run in isolation
   - Avoid sharing state between tests
   - Explicitly set up each test's required state

4. **Clear Assertions**
   - Make assertions specific and focused
   - Always parse Buffer response bodies before assertions
   - Verify both the response and the interaction with dependencies

## Implementation in Test Files

To implement these standards in a test file:

1. Import the standardized mocking utilities
2. Set up mocks for all required dependencies
3. Create helper functions for test-specific setup
4. Organize tests by feature or scenario
5. Use consistent assertion patterns

Example test file structure:

```typescript
// Import standardized mocking utilities
import { 
  createMockNextRequest, 
  parseResponseBody, 
  setupIntegrationTest 
} from '@/tests/utils/mocking';

// Mock dependencies
jest.mock('next/server', () => { /* standard NextJS mock */ });
jest.mock('@/lib/redis-client', () => { /* standard Redis mock */ });
jest.mock('@/app/api/middleware/secureTenantContext', () => { /* standard security mock */ });

// Import real code to test
import { handleUserRequest } from '@/app/api/users/route';

describe('User API', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisStore.clear();
    // Reset all control variables
  });
  
  describe('GET /api/users', () => {
    it('should return user list', async () => {
      // Setup
      const { request } = await setupIntegrationTest({
        redisData: {
          'users': JSON.stringify([{ id: '123', name: 'Test' }])
        }
      });
      
      // Execute
      const response = await handleUserRequest(request);
      
      // Verify
      expect(response.status).toBe(200);
      expect(parseResponseBody(response)).toEqual({
        users: [{ id: '123', name: 'Test' }]
      });
    });
    
    // More tests...
  });
  
  // More API endpoints...
});
```

By following these standardized patterns, we ensure consistency across all tests and make it easier to maintain and extend the test suite as the project grows.
