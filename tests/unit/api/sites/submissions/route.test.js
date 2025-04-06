/**
 * @jest-environment node
 */

const { NextRequest } = require('next/server');
const { GET, POST } = require('@/app/api/sites/[siteSlug]/submissions/route');
const { withSecureTenantPermission } = require('@/app/api/middleware/secureTenantContext');
const { SubmissionRedisService } = require('@/lib/submission-redis-service');
const { kv } = require('@/lib/redis-client');

// Mock the middleware
jest.mock('@/app/api/middleware/secureTenantContext', () => ({
  withSecureTenantPermission: jest.fn((req, resourceType, permission, handler) => {
    return handler(req, { userId: 'test-user-123', tenantId: 'test-tenant-123', siteId: 'test-site-123' });
  })
}));

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

// Mock the submission service
jest.mock('@/lib/submission-redis-service', () => ({
  SubmissionRedisService: {
    getSubmissionsBySite: jest.fn(),
    createSubmission: jest.fn()
  }
}));

describe('Submissions API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sites/[siteSlug]/submissions', () => {
    it('should return 404 if site not found', async () => {
      // Mock site not found
      kv.get.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions');
      const params = { siteSlug: 'test-site' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Site not found');
      expect(kv.get).toHaveBeenCalledWith('site:slug:test-site');
    });

    it('should return 403 if submissions are disabled for the site', async () => {
      // Mock site with disabled submissions
      kv.get.mockResolvedValue({
        id: 'test-site-123',
        tenantId: 'test-tenant-123',
        settings: {
          disableSubmissions: true
        }
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions');
      const params = { siteSlug: 'test-site' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Submissions are disabled for this site');
    });

    it('should return 403 if user is blocked from submitting', async () => {
      // Mock site
      kv.get.mockImplementation(async (key) => {
        if (key === 'site:slug:test-site') {
          return {
            id: 'test-site-123',
            tenantId: 'test-tenant-123',
            settings: {}
          };
        }
        if (key === 'site:test-site-123:blocked-users:test-user-123') {
          return true;
        }
        return null;
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions');
      const params = { siteSlug: 'test-site' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not allowed to submit content to this site');
    });

    it('should return user submissions with pagination', async () => {
      // Mock site
      kv.get.mockImplementation(async (key) => {
        if (key === 'site:slug:test-site') {
          return {
            id: 'test-site-123',
            tenantId: 'test-tenant-123',
            settings: {}
          };
        }
        return null;
      });

      // Mock submissions
      const mockSubmissions = [
        {
          id: 'sub-1',
          userId: 'test-user-123',
          title: 'Submission 1',
          status: 'pending',
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'sub-2',
          userId: 'test-user-123',
          title: 'Submission 2',
          status: 'pending',
          createdAt: '2023-01-02T00:00:00.000Z'
        },
        {
          id: 'sub-3',
          userId: 'other-user',
          title: 'Submission 3',
          status: 'pending',
          createdAt: '2023-01-03T00:00:00.000Z'
        }
      ];

      SubmissionRedisService.getSubmissionsBySite.mockResolvedValue(mockSubmissions);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions?page=1&limit=10');
      const params = { siteSlug: 'test-site' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2); // Only the user's submissions
      expect(data.data[0].id).toBe('sub-2'); // Sorted by date (newest first)
      expect(data.data[1].id).toBe('sub-1');
      expect(data.pagination).toEqual({
        page: 1,
        perPage: 10,
        total: 2,
        totalPages: 1
      });
    });
  });

  describe('POST /api/sites/[siteSlug]/submissions', () => {
    it('should return 404 if site not found', async () => {
      // Mock site not found
      kv.get.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Submission',
          description: 'Test description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site' };

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Site not found');
    });

    it('should return 403 if submissions are disabled for the site', async () => {
      // Mock site with disabled submissions
      kv.get.mockResolvedValue({
        id: 'test-site-123',
        tenantId: 'test-tenant-123',
        settings: {
          disableSubmissions: true
        }
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Submission',
          description: 'Test description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site' };

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Submissions are disabled for this site');
    });

    it('should create a new submission', async () => {
      // Mock site
      kv.get.mockImplementation(async (key) => {
        if (key === 'site:slug:test-site') {
          return {
            id: 'test-site-123',
            tenantId: 'test-tenant-123',
            settings: {}
          };
        }
        return null;
      });

      // Mock submission creation
      const mockSubmission = {
        id: 'sub-new',
        siteId: 'test-site-123',
        tenantId: 'test-tenant-123',
        title: 'New Submission',
        description: 'Test description',
        categoryIds: ['cat-1'],
        status: 'pending',
        userId: 'test-user-123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      SubmissionRedisService.createSubmission.mockResolvedValue(mockSubmission);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Submission',
          description: 'Test description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site' };

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockSubmission);
      expect(SubmissionRedisService.createSubmission).toHaveBeenCalled();
      expect(SubmissionRedisService.createSubmission.mock.calls[0][0]).toMatchObject({
        title: 'New Submission',
        description: 'Test description',
        categoryIds: ['cat-1'],
        userId: 'test-user-123',
        siteId: 'test-site-123',
        tenantId: 'test-tenant-123'
      });
    });

    it('should validate required fields', async () => {
      // Mock site
      kv.get.mockImplementation(async (key) => {
        if (key === 'site:slug:test-site') {
          return {
            id: 'test-site-123',
            tenantId: 'test-tenant-123',
            settings: {}
          };
        }
        return null;
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions', {
        method: 'POST',
        body: JSON.stringify({
          // Missing title
          description: 'Test description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site' };

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title is required');
    });
  });
});
