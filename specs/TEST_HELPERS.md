# Test Helpers and Utilities

This document describes the test helpers, utilities, and middleware available for testing the DirectoryMonster application.

## Table of Contents

1. [Test Helpers](#test-helpers)
2. [Test Fixtures](#test-fixtures)
3. [Mock Implementations](#mock-implementations)
4. [Test Middleware](#test-middleware)
5. [Utility Functions](#utility-functions)

## Test Helpers

DirectoryMonster includes several test helpers to simplify common testing tasks:

### 1. `renderWithRouter`

A custom render function that provides Next.js router context:

```typescript
// src/test-utils/render-with-router.tsx
import { render } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { NextRouter } from 'next/router';

export const createMockRouter = (overrides = {}): NextRouter => ({
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  },
  isFallback: false,
  isReady: true,
  ...overrides
});

export const renderWithRouter = (ui: React.ReactNode, routerOptions = {}) => {
  const mockRouter = createMockRouter(routerOptions);
  
  return {
    ...render(
      <RouterContext.Provider value={mockRouter}>
        {ui}
      </RouterContext.Provider>
    ),
    mockRouter
  };
};
```

### 2. `renderWithAuth`

A custom render function that provides authentication context:

```typescript
// src/test-utils/render-with-auth.tsx
import { render } from '@testing-library/react';
import { AuthContext } from '@/contexts/auth';

export const renderWithAuth = (ui: React.ReactNode, authProps = {}) => {
  const defaultAuthProps = {
    user: null,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    ...authProps
  };
  
  return {
    ...render(
      <AuthContext.Provider value={defaultAuthProps}>
        {ui}
      </AuthContext.Provider>
    ),
    authProps: defaultAuthProps
  };
};
```

### 3. `renderWithSite`

A custom render function that provides site context for multitenancy testing:

```typescript
// src/test-utils/render-with-site.tsx
import { render } from '@testing-library/react';
import { SiteContext } from '@/contexts/site';

// Mock site resolution
jest.mock('@/lib/site-utils', () => ({
  getSiteFromHostname: jest.fn()
}));

const { getSiteFromHostname } = require('@/lib/site-utils');

export const renderWithSite = (ui: React.ReactNode, options = {}) => {
  const { hostname = 'example.com', site = null, ...renderOptions } = options;
  
  // Mock the site resolution
  if (hostname === 'site1.example.com') {
    getSiteFromHostname.mockResolvedValue({
      id: 'site-1',
      name: 'Site 1',
      slug: 'site1',
      logo: '/site1-logo.png',
      domains: ['site1.example.com']
    });
  } else if (hostname === 'site2.example.com') {
    getSiteFromHostname.mockResolvedValue({
      id: 'site-2',
      name: 'Site 2',
      slug: 'site2',
      logo: '/site2-logo.png',
      domains: ['site2.example.com']
    });
  } else if (site) {
    getSiteFromHostname.mockResolvedValue(site);
  } else {
    getSiteFromHostname.mockResolvedValue(null);
  }
  
  const mockSiteContext = {
    site: site,
    loading: false,
    error: null
  };
  
  return {
    ...render(
      <SiteContext.Provider value={mockSiteContext}>
        {ui}
      </SiteContext.Provider>,
      renderOptions
    ),
    mockSiteContext
  };
};
```

### 4. `renderHookWithContext`

A custom renderHook function for testing hooks with context:

```typescript
// src/test-utils/render-hook-with-context.tsx
import { renderHook } from '@testing-library/react';
import { SiteContext } from '@/contexts/site';
import { AuthContext } from '@/contexts/auth';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { createMockRouter } from './render-with-router';

export const renderHookWithContext = (
  hook,
  {
    authProps = {},
    routerProps = {},
    siteProps = {},
    ...renderOptions
  } = {}
) => {
  const mockRouter = createMockRouter(routerProps);
  
  const defaultAuthProps = {
    user: null,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    ...authProps
  };
  
  const defaultSiteProps = {
    site: null,
    loading: false,
    error: null,
    ...siteProps
  };
  
  const wrapper = ({ children }) => (
    <RouterContext.Provider value={mockRouter}>
      <AuthContext.Provider value={defaultAuthProps}>
        <SiteContext.Provider value={defaultSiteProps}>
          {children}
        </SiteContext.Provider>
      </AuthContext.Provider>
    </RouterContext.Provider>
  );
  
  return {
    ...renderHook(hook, { wrapper, ...renderOptions }),
    mockRouter,
    authProps: defaultAuthProps,
    siteProps: defaultSiteProps
  };
};
```

## Test Fixtures

DirectoryMonster includes test fixtures to provide consistent test data:

### 1. Site Fixtures

```typescript
// tests/__fixtures__/sites.ts
export const sites = [
  {
    id: 'site-1',
    name: 'Fishing Gear Reviews',
    slug: 'fishing-gear',
    description: 'Reviews of fishing gear and equipment',
    domains: ['fishinggearreviews.com', 'fishing-gear.mydirectory.com'],
    logo: '/logos/fishing-gear.png',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'site-2',
    name: 'Hiking Gear Reviews',
    slug: 'hiking-gear',
    description: 'Reviews of hiking gear and equipment',
    domains: ['hikinggearreviews.com', 'hiking-gear.mydirectory.com'],
    logo: '/logos/hiking-gear.png',
    createdAt: '2023-01-02T00:00:00Z'
  }
];

export const getSiteBySlug = (slug) => {
  return sites.find((site) => site.slug === slug);
};

export const getSiteById = (id) => {
  return sites.find((site) => site.id === id);
};
```

### 2. Category Fixtures

```typescript
// tests/__fixtures__/categories.ts
export const categories = {
  'fishing-gear': [
    {
      id: 'cat-1',
      siteId: 'site-1',
      name: 'Rods',
      slug: 'rods',
      description: 'Fishing rods',
      parentId: null,
      order: 1,
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'cat-2',
      siteId: 'site-1',
      name: 'Reels',
      slug: 'reels',
      description: 'Fishing reels',
      parentId: null,
      order: 2,
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'cat-3',
      siteId: 'site-1',
      name: 'Baitcasting Reels',
      slug: 'baitcasting-reels',
      description: 'Baitcasting fishing reels',
      parentId: 'cat-2',
      order: 1,
      createdAt: '2023-01-01T00:00:00Z'
    }
  ],
  'hiking-gear': [
    {
      id: 'cat-4',
      siteId: 'site-2',
      name: 'Backpacks',
      slug: 'backpacks',
      description: 'Hiking backpacks',
      parentId: null,
      order: 1,
      createdAt: '2023-01-02T00:00:00Z'
    },
    {
      id: 'cat-5',
      siteId: 'site-2',
      name: 'Boots',
      slug: 'boots',
      description: 'Hiking boots',
      parentId: null,
      order: 2,
      createdAt: '2023-01-02T00:00:00Z'
    }
  ]
};

export const getCategoriesBySiteSlug = (siteSlug) => {
  return categories[siteSlug] || [];
};

export const getCategoryById = (id) => {
  for (const siteSlug in categories) {
    const category = categories[siteSlug].find((cat) => cat.id === id);
    if (category) return category;
  }
  return null;
};
```

### 3. Listing Fixtures

```typescript
// tests/__fixtures__/listings.ts
export const listings = {
  'fishing-gear': [
    {
      id: 'listing-1',
      siteId: 'site-1',
      title: 'Premium Fishing Rod',
      slug: 'premium-fishing-rod',
      description: 'A high-quality fishing rod for professionals',
      categoryId: 'cat-1',
      price: 199.99,
      images: ['/images/fishing-rod-1.jpg'],
      featured: true,
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'listing-2',
      siteId: 'site-1',
      title: 'Baitcasting Reel',
      slug: 'baitcasting-reel',
      description: 'Professional baitcasting reel',
      categoryId: 'cat-3',
      price: 149.99,
      images: ['/images/reel-1.jpg'],
      featured: false,
      createdAt: '2023-01-01T01:00:00Z'
    }
  ],
  'hiking-gear': [
    {
      id: 'listing-3',
      siteId: 'site-2',
      title: 'Hiking Backpack 40L',
      slug: 'hiking-backpack-40l',
      description: 'Spacious hiking backpack for multi-day trips',
      categoryId: 'cat-4',
      price: 129.99,
      images: ['/images/backpack-1.jpg'],
      featured: true,
      createdAt: '2023-01-02T00:00:00Z'
    },
    {
      id: 'listing-4',
      siteId: 'site-2',
      title: 'Waterproof Hiking Boots',
      slug: 'waterproof-hiking-boots',
      description: 'Durable waterproof hiking boots',
      categoryId: 'cat-5',
      price: 179.99,
      images: ['/images/boots-1.jpg'],
      featured: true,
      createdAt: '2023-01-02T01:00:00Z'
    }
  ]
};

export const getListingsBySiteSlug = (siteSlug) => {
  return listings[siteSlug] || [];
};

export const getListingById = (id) => {
  for (const siteSlug in listings) {
    const listing = listings[siteSlug].find((lst) => lst.id === id);
    if (listing) return listing;
  }
  return null;
};

export const getListingsByCategory = (categoryId) => {
  const results = [];
  for (const siteSlug in listings) {
    const filtered = listings[siteSlug].filter((lst) => lst.categoryId === categoryId);
    results.push(...filtered);
  }
  return results;
};
```

## Mock Implementations

### 1. Next.js Router Mocks

```typescript
// tests/__mocks__/nextNavigation.tsx
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/admin/sites',
  query: {},
};

export const useRouter = jest.fn(() => mockRouter);
export const usePathname = jest.fn(() => '/admin/sites');
export const useSearchParams = jest.fn(() => new URLSearchParams());

export const resetMocks = () => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.refresh.mockReset();
  mockRouter.prefetch.mockReset();
  useRouter.mockReset();
  useRouter.mockImplementation(() => mockRouter);
  usePathname.mockReset();
  usePathname.mockImplementation(() => '/admin/sites');
  useSearchParams.mockReset();
  useSearchParams.mockImplementation(() => new URLSearchParams());
};
```

### 2. Redis Client Mocks

```typescript
// tests/__mocks__/redis-client.ts
const mockClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  hgetall: jest.fn(),
  hset: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  scan: jest.fn(),
  keys: jest.fn(),
  quit: jest.fn(),
};

export const getClient = jest.fn(() => mockClient);
export const USE_MEMORY_FALLBACK = true;

export const resetMocks = () => {
  mockClient.get.mockReset();
  mockClient.set.mockReset();
  mockClient.del.mockReset();
  mockClient.hgetall.mockReset();
  mockClient.hset.mockReset();
  mockClient.exists.mockReset();
  mockClient.incr.mockReset();
  mockClient.scan.mockReset();
  mockClient.keys.mockReset();
  mockClient.quit.mockReset();
  getClient.mockReset();
  getClient.mockImplementation(() => mockClient);
};
```

### 3. Auth Service Mocks

```typescript
// tests/__mocks__/auth.ts
export const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  role: 'admin',
};

export const signIn = jest.fn();
export const signOut = jest.fn();
export const getSession = jest.fn();
export const verifyAuth = jest.fn();

export const resetMocks = () => {
  signIn.mockReset();
  signOut.mockReset();
  getSession.mockReset();
  verifyAuth.mockReset();
  
  // Default implementations
  signIn.mockResolvedValue({ user: mockUser });
  signOut.mockResolvedValue(true);
  getSession.mockResolvedValue({ user: mockUser });
  verifyAuth.mockResolvedValue(true);
};
```

## Test Middleware

### 1. `withRedis` Middleware Test Helper

```typescript
// tests/middleware/withRedis.test.ts
import { withRedis } from '@/middleware/withRedis';
import { createRequest, createResponse } from 'node-mocks-http';

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  getClient: jest.fn(),
  USE_MEMORY_FALLBACK: true,
}));

describe('withRedis Middleware', () => {
  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
  };
  
  const mockHandler = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    require('@/lib/redis-client').getClient.mockReturnValue(mockRedisClient);
  });
  
  it('adds Redis client to the request', async () => {
    // Create wrapped handler
    const wrappedHandler = withRedis(mockHandler);
    
    // Create mock request and response
    const req = createRequest();
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify handler was called with modified request
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][0].redis).toBe(mockRedisClient);
  });
  
  it('handles Redis client errors', async () => {
    // Make getClient throw an error
    require('@/lib/redis-client').getClient.mockImplementation(() => {
      throw new Error('Redis connection failed');
    });
    
    // Create wrapped handler
    const wrappedHandler = withRedis(mockHandler);
    
    // Create mock request and response
    const req = createRequest();
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify response has error status
    expect(res._getStatusCode()).toBe(500);
    
    // Verify response has error message
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Database connection error');
  });
});
```

### 2. `withAuth` Middleware Test Helper

```typescript
// tests/middleware/withAuth.test.ts
import { withAuth } from '@/middleware/withAuth';
import { createRequest, createResponse } from 'node-mocks-http';

// Mock auth verification
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('withAuth Middleware', () => {
  const { verifyAuth } = require('@/lib/auth');
  const mockHandler = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandler.mockReset();
  });
  
  it('allows authenticated requests', async () => {
    // Mock successful authentication
    verifyAuth.mockResolvedValueOnce({
      id: 'user-123',
      role: 'admin',
    });
    
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create mock request and response
    const req = createRequest({
      headers: {
        authorization: 'Bearer token123',
      },
    });
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify auth was checked
    expect(verifyAuth).toHaveBeenCalledWith('token123');
    
    // Verify handler was called with user in request
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][0].user).toEqual({
      id: 'user-123',
      role: 'admin',
    });
  });
  
  it('rejects unauthenticated requests', async () => {
    // Mock failed authentication
    verifyAuth.mockResolvedValueOnce(false);
    
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create mock request and response
    const req = createRequest({
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify auth was checked
    expect(verifyAuth).toHaveBeenCalledWith('invalid-token');
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Verify response has unauthorized status
    expect(res._getStatusCode()).toBe(401);
    
    // Verify response has error message
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Unauthorized');
  });
  
  it('rejects requests without authorization header', async () => {
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create mock request and response without auth header
    const req = createRequest();
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify auth was not checked
    expect(verifyAuth).not.toHaveBeenCalled();
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Verify response has unauthorized status
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('handles authentication errors', async () => {
    // Mock auth error
    verifyAuth.mockRejectedValueOnce(new Error('Auth service unavailable'));
    
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create mock request and response
    const req = createRequest({
      headers: {
        authorization: 'Bearer token123',
      },
    });
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify response has error status
    expect(res._getStatusCode()).toBe(500);
    
    // Verify response has error message
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Authentication error');
  });
});
```

## Utility Functions

### 1. Test Data Generation

```typescript
// tests/utils/test-data-generator.ts
import { v4 as uuidv4 } from 'uuid';

export const generateTestSite = (overrides = {}) => ({
  id: `site-${uuidv4().slice(0, 8)}`,
  name: 'Test Site',
  slug: 'test-site',
  description: 'A test site',
  domains: ['test-site.example.com'],
  logo: '/test-logo.png',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateTestCategory = (siteId, overrides = {}) => ({
  id: `cat-${uuidv4().slice(0, 8)}`,
  siteId,
  name: 'Test Category',
  slug: 'test-category',
  description: 'A test category',
  parentId: null,
  order: 1,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateTestListing = (siteId, categoryId, overrides = {}) => ({
  id: `listing-${uuidv4().slice(0, 8)}`,
  siteId,
  categoryId,
  title: 'Test Listing',
  slug: 'test-listing',
  description: 'A test listing',
  price: 99.99,
  images: ['/test-image.jpg'],
  featured: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateMultipleTestListings = (siteId, categoryId, count = 5) => {
  return Array.from({ length: count }, (_, i) => 
    generateTestListing(siteId, categoryId, {
      title: `Test Listing ${i + 1}`,
      slug: `test-listing-${i + 1}`,
    })
  );
};
```

### 2. Test Assertions

```typescript
// tests/utils/test-assertions.ts
import { screen } from '@testing-library/react';

export const expectPaginationToBe = (page, totalPages) => {
  // Check current page indicator
  expect(screen.getByText(`Page ${page} of ${totalPages}`)).toBeInTheDocument();
  
  // Check previous button state
  const prevButton = screen.getByRole('button', { name: /previous/i });
  if (page === 1) {
    expect(prevButton).toBeDisabled();
  } else {
    expect(prevButton).not.toBeDisabled();
  }
  
  // Check next button state
  const nextButton = screen.getByRole('button', { name: /next/i });
  if (page === totalPages) {
    expect(nextButton).toBeDisabled();
  } else {
    expect(nextButton).not.toBeDisabled();
  }
};

export const expectTableToHaveRows = (count) => {
  const rows = screen.getAllByRole('row');
  // Subtract 1 for header row
  expect(rows.length - 1).toBe(count);
};

export const expectFormValidationError = (fieldName, errorMessage) => {
  const errorElement = screen.getByTestId(`${fieldName}-error`);
  expect(errorElement).toBeInTheDocument();
  expect(errorElement).toHaveTextContent(errorMessage);
};

export const expectToBeAccessible = async () => {
  const { axe, toHaveNoViolations } = require('jest-axe');
  expect.extend(toHaveNoViolations);
  
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
};
```

### 3. Mock Event Helpers

```typescript
// tests/utils/mock-events.ts
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['dummy content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

export const createMockFileList = (files) => {
  return {
    ...files,
    item: (index) => files[index],
    length: files.length,
  };
};

export const createMockChangeEvent = (name, value) => {
  return {
    target: {
      name,
      value,
    },
  };
};

export const createMockFileEvent = (files) => {
  const fileList = createMockFileList(files);
  return {
    target: {
      files: fileList,
    },
  };
};

export const createMockFormEvent = () => {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  };
};
```
