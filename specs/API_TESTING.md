# API Testing Patterns

This document outlines the patterns and practices for testing API endpoints in the DirectoryMonster application.

## Table of Contents

1. [API Test Structure](#api-test-structure)
2. [Setup and Mocking](#setup-and-mocking)
3. [Testing Patterns](#testing-patterns)
4. [Error Handling](#error-handling)
5. [Authentication Testing](#authentication-testing)
6. [Examples](#examples)

## API Test Structure

API tests should follow this basic structure:

```typescript
import { createRequest, createResponse } from 'node-mocks-http';
import handler from '@/app/api/[endpoint]/route';

// Mock dependencies
jest.mock('@/lib/redis-client', () => ({
  getClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    // Add other Redis methods as needed
  }),
}));

describe('API: /api/[endpoint]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('handles GET requests correctly', async () => {
    // Create mock request and response
    const req = createRequest({
      method: 'GET',
      headers: {
        'host': 'example.com'
      },
      query: {
        param: 'value'
      }
    });
    const res = createResponse();
    
    // Call the handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: expect.any(Array)
    });
  });
  
  it('handles POST requests correctly', async () => {
    // Test POST functionality
  });
  
  it('handles error conditions', async () => {
    // Test error handling
  });
  
  // Additional test cases...
});
```

## Setup and Mocking

### Redis Mocking

```typescript
jest.mock('@/lib/redis-client', () => {
  const mockClient = {
    get: jest.fn(),
    set: jest.fn(),
    hgetall: jest.fn(),
    // Add other methods as needed
  };
  
  return {
    getClient: jest.fn().mockReturnValue(mockClient),
    USE_MEMORY_FALLBACK: true
  };
});

// In your tests, access the mock client
const redisClient = require('@/lib/redis-client').getClient();

// Setup mock return values
redisClient.get.mockResolvedValueOnce(JSON.stringify({ id: '123', name: 'Test' }));
```

### Testing with Different Hosts

```typescript
it('identifies the correct site based on hostname', async () => {
  // Test with different hostnames
  const req1 = createRequest({
    method: 'GET',
    headers: {
      'host': 'example.com'
    }
  });
  
  const req2 = createRequest({
    method: 'GET',
    headers: {
      'host': 'other-site.com'
    }
  });
  
  const res1 = createResponse();
  const res2 = createResponse();
  
  // Mock Redis to return different site data based on hostname
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get
    .mockImplementation((key) => {
      if (key.includes('example.com')) {
        return Promise.resolve(JSON.stringify({ id: 'site-1', name: 'Example Site' }));
      } else if (key.includes('other-site.com')) {
        return Promise.resolve(JSON.stringify({ id: 'site-2', name: 'Other Site' }));
      }
      return Promise.resolve(null);
    });
  
  // Call handler with different requests
  await handler(req1, res1);
  await handler(req2, res2);
  
  // Verify different responses
  const data1 = JSON.parse(res1._getData());
  const data2 = JSON.parse(res2._getData());
  
  expect(data1.site.id).toBe('site-1');
  expect(data2.site.id).toBe('site-2');
});
```

## Testing Patterns

### 1. Testing GET Endpoints

```typescript
it('returns paginated results', async () => {
  // Setup mock data
  const mockItems = Array.from({ length: 20 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`
  }));
  
  // Mock Redis to return items
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(JSON.stringify(mockItems));
  
  // Create request with pagination params
  const req = createRequest({
    method: 'GET',
    query: {
      page: '2',
      limit: '5'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  const data = JSON.parse(res._getData());
  
  expect(res._getStatusCode()).toBe(200);
  expect(data.items.length).toBe(5); // Should return 5 items
  expect(data.items[0].id).toBe('item-6'); // Should start from the 6th item (2nd page)
  expect(data.pagination).toEqual({
    page: 2,
    limit: 5,
    total: 20,
    totalPages: 4
  });
});

it('filters results based on query parameters', async () => {
  // Setup mock data
  const mockItems = [
    { id: '1', category: 'A', status: 'active' },
    { id: '2', category: 'B', status: 'active' },
    { id: '3', category: 'A', status: 'inactive' },
    { id: '4', category: 'C', status: 'active' }
  ];
  
  // Mock Redis
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(JSON.stringify(mockItems));
  
  // Create request with filter params
  const req = createRequest({
    method: 'GET',
    query: {
      category: 'A',
      status: 'active'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify filtered response
  const data = JSON.parse(res._getData());
  
  expect(res._getStatusCode()).toBe(200);
  expect(data.items.length).toBe(1); // Only one item matches both criteria
  expect(data.items[0].id).toBe('1');
});
```

### 2. Testing POST Endpoints

```typescript
it('creates a new resource', async () => {
  // Mock Redis
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(null); // No existing item
  redisClient.set.mockResolvedValueOnce('OK');
  
  // Create request with body data
  const req = createRequest({
    method: 'POST',
    body: {
      name: 'New Item',
      description: 'Test description'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(201);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(true);
  expect(data.item).toHaveProperty('id');
  expect(data.item.name).toBe('New Item');
  
  // Verify Redis was called correctly
  expect(redisClient.set).toHaveBeenCalledTimes(1);
  expect(redisClient.set.mock.calls[0][1]).toContain('New Item');
});
```

### 3. Testing PUT/PATCH Endpoints

```typescript
it('updates an existing resource', async () => {
  // Mock existing data
  const existingItem = {
    id: 'item-123',
    name: 'Original Name',
    description: 'Original description',
    createdAt: '2023-01-01T00:00:00Z'
  };
  
  // Mock Redis
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(JSON.stringify(existingItem));
  redisClient.set.mockResolvedValueOnce('OK');
  
  // Create request
  const req = createRequest({
    method: 'PUT',
    url: '/api/items/item-123',
    params: {
      id: 'item-123'
    },
    body: {
      name: 'Updated Name',
      description: 'Updated description'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(200);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(true);
  expect(data.item.id).toBe('item-123');
  expect(data.item.name).toBe('Updated Name');
  expect(data.item.description).toBe('Updated description');
  expect(data.item.createdAt).toBe('2023-01-01T00:00:00Z'); // Should preserve original createdAt
  
  // Verify Redis was called correctly
  expect(redisClient.set).toHaveBeenCalledTimes(1);
  const savedItem = JSON.parse(redisClient.set.mock.calls[0][1]);
  expect(savedItem).toEqual({
    id: 'item-123',
    name: 'Updated Name',
    description: 'Updated description',
    createdAt: '2023-01-01T00:00:00Z'
  });
});
```

### 4. Testing DELETE Endpoints

```typescript
it('deletes an existing resource', async () => {
  // Mock Redis
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(JSON.stringify({ id: 'item-123' })); // Item exists
  redisClient.del.mockResolvedValueOnce(1); // Successful deletion
  
  // Create request
  const req = createRequest({
    method: 'DELETE',
    url: '/api/items/item-123',
    params: {
      id: 'item-123'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(200);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(true);
  expect(data.message).toContain('deleted');
  
  // Verify Redis was called correctly
  expect(redisClient.del).toHaveBeenCalledTimes(1);
  expect(redisClient.del).toHaveBeenCalledWith(expect.stringContaining('item-123'));
});
```

## Error Handling

### 1. Testing Not Found Errors

```typescript
it('returns 404 when resource is not found', async () => {
  // Mock Redis to return null (item not found)
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(null);
  
  // Create request
  const req = createRequest({
    method: 'GET',
    url: '/api/items/non-existent',
    params: {
      id: 'non-existent'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(404);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(false);
  expect(data.error).toContain('not found');
});
```

### 2. Testing Validation Errors

```typescript
it('returns 400 for invalid request data', async () => {
  // Create request with invalid data
  const req = createRequest({
    method: 'POST',
    body: {
      // Missing required fields
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(400);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(false);
  expect(data.errors).toBeInstanceOf(Array);
  expect(data.errors.length).toBeGreaterThan(0);
});
```

### 3. Testing Server Errors

```typescript
it('handles server errors gracefully', async () => {
  // Mock Redis to throw an error
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockRejectedValueOnce(new Error('Database connection failed'));
  
  // Create request
  const req = createRequest({
    method: 'GET'
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(500);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(false);
  expect(data.error).toContain('server error');
  
  // Error details should not be exposed to clients
  expect(data.error).not.toContain('Database connection failed');
});
```

## Authentication Testing

### 1. Testing Protected Endpoints

```typescript
import { verifyAuth } from '@/lib/auth';

// Mock auth verification
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn()
}));

it('rejects unauthorized requests', async () => {
  // Mock auth verification to fail
  verifyAuth.mockResolvedValueOnce(false);
  
  // Create request
  const req = createRequest({
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid-token'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(401);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(false);
  expect(data.error).toContain('unauthorized');
});

it('allows authenticated requests', async () => {
  // Mock auth verification to succeed with user data
  verifyAuth.mockResolvedValueOnce({
    id: 'user-123',
    role: 'admin'
  });
  
  // Also mock Redis to return data
  const redisClient = require('@/lib/redis-client').getClient();
  redisClient.get.mockResolvedValueOnce(JSON.stringify([{ id: '1', name: 'Item 1' }]));
  
  // Create request
  const req = createRequest({
    method: 'GET',
    headers: {
      'Authorization': 'Bearer valid-token'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(200);
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(true);
});
```

### 2. Testing Role-Based Access Control

```typescript
it('restricts access based on user role', async () => {
  // Mock auth verification to succeed but with non-admin role
  verifyAuth.mockResolvedValueOnce({
    id: 'user-123',
    role: 'user' // Not an admin
  });
  
  // Create request for admin-only endpoint
  const req = createRequest({
    method: 'DELETE', // Assuming DELETE requires admin privileges
    url: '/api/items/item-123',
    params: {
      id: 'item-123'
    },
    headers: {
      'Authorization': 'Bearer valid-token'
    }
  });
  
  const res = createResponse();
  
  // Call the handler
  await handler(req, res);
  
  // Verify response
  expect(res._getStatusCode()).toBe(403); // Forbidden
  
  const data = JSON.parse(res._getData());
  expect(data.success).toBe(false);
  expect(data.error).toContain('permission');
});
```

## Examples

### Example 1: Testing the Sites API

```typescript
import { createRequest, createResponse } from 'node-mocks-http';
import { handler } from '@/app/api/sites/route';

// Mock dependencies
jest.mock('@/lib/redis-client');
jest.mock('@/lib/auth');

describe('API: /api/sites', () => {
  const redisClient = require('@/lib/redis-client').getClient();
  const { verifyAuth } = require('@/lib/auth');
  
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAuth.mockResolvedValue({ id: 'user-123', role: 'admin' });
  });
  
  it('GET returns all sites', async () => {
    // Mock Redis response
    const mockSites = [
      { id: 'site-1', name: 'Site 1', domains: ['example.com'] },
      { id: 'site-2', name: 'Site 2', domains: ['test.org'] }
    ];
    redisClient.get.mockResolvedValueOnce(JSON.stringify(mockSites));
    
    // Create request
    const req = createRequest({ method: 'GET' });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.sites).toHaveLength(2);
    expect(data.sites[0].id).toBe('site-1');
    expect(data.sites[1].id).toBe('site-2');
  });
  
  it('POST creates a new site', async () => {
    // Mock Redis successful save
    redisClient.set.mockResolvedValueOnce('OK');
    
    // Create request with site data
    const req = createRequest({
      method: 'POST',
      body: {
        name: 'New Site',
        slug: 'new-site',
        description: 'A new test site',
        domains: ['newsite.com']
      }
    });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.site.name).toBe('New Site');
    expect(data.site.slug).toBe('new-site');
    expect(data.site.domains).toContain('newsite.com');
    
    // Verify Redis call
    expect(redisClient.set).toHaveBeenCalledTimes(1);
    // Verify that an ID was generated
    const savedData = JSON.parse(redisClient.set.mock.calls[0][1]);
    expect(savedData.id).toBeDefined();
  });
  
  it('validates required fields', async () => {
    // Create request with missing fields
    const req = createRequest({
      method: 'POST',
      body: {
        // Missing name and domains
        slug: 'invalid-site'
      }
    });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(400);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.errors).toContain('Name is required');
    expect(data.errors).toContain('At least one domain is required');
    
    // Redis should not be called
    expect(redisClient.set).not.toHaveBeenCalled();
  });
});
```

### Example 2: Testing the Site-Specific API

```typescript
import { createRequest, createResponse } from 'node-mocks-http';
import { handler } from '@/app/api/sites/[siteId]/route';

// Mock dependencies
jest.mock('@/lib/redis-client');
jest.mock('@/lib/auth');

describe('API: /api/sites/[siteId]', () => {
  const redisClient = require('@/lib/redis-client').getClient();
  const { verifyAuth } = require('@/lib/auth');
  
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAuth.mockResolvedValue({ id: 'user-123', role: 'admin' });
  });
  
  it('GET returns the specific site', async () => {
    // Mock Redis response
    const mockSite = { id: 'site-123', name: 'Test Site', domains: ['test.com'] };
    redisClient.get.mockResolvedValueOnce(JSON.stringify(mockSite));
    
    // Create request
    const req = createRequest({
      method: 'GET',
      url: '/api/sites/site-123',
      params: {
        siteId: 'site-123'
      }
    });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.site.id).toBe('site-123');
    expect(data.site.name).toBe('Test Site');
    expect(data.site.domains).toContain('test.com');
  });
  
  it('returns 404 for non-existent site', async () => {
    // Mock Redis returning null
    redisClient.get.mockResolvedValueOnce(null);
    
    // Create request
    const req = createRequest({
      method: 'GET',
      url: '/api/sites/non-existent',
      params: {
        siteId: 'non-existent'
      }
    });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(404);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toContain('Site not found');
  });
  
  it('PUT updates the site', async () => {
    // Mock existing site
    const existingSite = {
      id: 'site-123',
      name: 'Original Name',
      slug: 'original-slug',
      domains: ['original.com'],
      createdAt: '2023-01-01T00:00:00Z'
    };
    
    // Mock Redis
    redisClient.get.mockResolvedValueOnce(JSON.stringify(existingSite));
    redisClient.set.mockResolvedValueOnce('OK');
    
    // Create request with updated data
    const req = createRequest({
      method: 'PUT',
      url: '/api/sites/site-123',
      params: {
        siteId: 'site-123'
      },
      body: {
        name: 'Updated Name',
        domains: ['updated.com', 'another.com']
      }
    });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.site.id).toBe('site-123');
    expect(data.site.name).toBe('Updated Name');
    expect(data.site.slug).toBe('original-slug'); // Should preserve original slug
    expect(data.site.domains).toContain('updated.com');
    expect(data.site.domains).toContain('another.com');
    expect(data.site.domains).not.toContain('original.com');
    expect(data.site.createdAt).toBe('2023-01-01T00:00:00Z'); // Should preserve createdAt
    
    // Verify Redis was updated
    expect(redisClient.set).toHaveBeenCalledTimes(1);
  });
  
  it('DELETE removes the site', async () => {
    // Mock Redis
    redisClient.get.mockResolvedValueOnce(JSON.stringify({ id: 'site-123' }));
    redisClient.del.mockResolvedValueOnce(1);
    
    // Create request
    const req = createRequest({
      method: 'DELETE',
      url: '/api/sites/site-123',
      params: {
        siteId: 'site-123'
      }
    });
    const res = createResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toContain('Site deleted');
    
    // Verify Redis delete was called
    expect(redisClient.del).toHaveBeenCalledTimes(1);
  });
});
```
