/**
 * @jest-environment node
 */

const { NextRequest } = require('next/server');
const { GET, PUT, DELETE } = require('@/app/api/sites/[siteSlug]/submissions/[submissionId]/route');
const { withSecureTenantPermission } = require('@/app/api/middleware/secureTenantContext');
const { SubmissionRedisService } = require('@/lib/submission-redis-service');
const { kv } = require('@/lib/redis-client');
const { SubmissionStatus } = require('@/types/submission');

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
    getSubmission: jest.fn(),
    updateSubmission: jest.fn()
  }
}));

describe('Submission Detail API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sites/[siteSlug]/submissions/[submissionId]', () => {
    it('should return 404 if site not found', async () => {
      // Mock site not found
      kv.get.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123');
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Site not found');
      expect(kv.get).toHaveBeenCalledWith('site:slug:test-site');
    });

    it('should return 404 if submission not found', async () => {
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

      // Mock submission not found
      SubmissionRedisService.getSubmission.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123');
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Submission not found');
    });

    it('should return 403 if submission does not belong to user', async () => {
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

      // Mock submission with different user
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        title: 'Test Submission'
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123');
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to access this submission');
    });

    it('should return the submission if it belongs to the user', async () => {
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

      // Mock submission
      const mockSubmission = {
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Test Submission',
        description: 'Test description',
        status: 'pending'
      };
      SubmissionRedisService.getSubmission.mockResolvedValue(mockSubmission);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123');
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSubmission);
    });
  });

  describe('PUT /api/sites/[siteSlug]/submissions/[submissionId]', () => {
    it('should return 404 if submission not found', async () => {
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

      // Mock submission not found
      SubmissionRedisService.getSubmission.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Submission',
          description: 'Updated description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await PUT(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Submission not found');
    });

    it('should return 403 if submission does not belong to user', async () => {
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

      // Mock submission with different user
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        title: 'Test Submission'
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Submission',
          description: 'Updated description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await PUT(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to update this submission');
    });

    it('should return 400 if submission cannot be updated', async () => {
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

      // Mock approved submission
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Test Submission',
        status: SubmissionStatus.APPROVED
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Submission',
          description: 'Updated description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await PUT(req, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This submission cannot be updated because it has already been processed');
    });

    it('should update the submission', async () => {
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

      // Mock pending submission
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Test Submission',
        status: SubmissionStatus.PENDING
      });

      // Mock updated submission
      const updatedSubmission = {
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Updated Submission',
        description: 'Updated description',
        categoryIds: ['cat-1'],
        status: SubmissionStatus.PENDING
      };
      SubmissionRedisService.updateSubmission.mockResolvedValue(updatedSubmission);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Submission',
          description: 'Updated description',
          categoryIds: ['cat-1']
        })
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await PUT(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedSubmission);
      expect(SubmissionRedisService.updateSubmission).toHaveBeenCalledWith(
        'test-site-123',
        'sub-123',
        expect.objectContaining({
          title: 'Updated Submission',
          description: 'Updated description',
          categoryIds: ['cat-1'],
          status: SubmissionStatus.PENDING
        })
      );
    });
  });

  describe('DELETE /api/sites/[siteSlug]/submissions/[submissionId]', () => {
    it('should return 404 if submission not found', async () => {
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

      // Mock submission not found
      SubmissionRedisService.getSubmission.mockResolvedValue(null);

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'DELETE'
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await DELETE(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Submission not found');
    });

    it('should return 403 if submission does not belong to user', async () => {
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

      // Mock submission with different user
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'other-user',
        title: 'Test Submission'
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'DELETE'
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await DELETE(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to withdraw this submission');
    });

    it('should return 400 if submission cannot be withdrawn', async () => {
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

      // Mock approved submission
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Test Submission',
        status: SubmissionStatus.APPROVED
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'DELETE'
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await DELETE(req, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This submission cannot be withdrawn because it has already been approved');
    });

    it('should withdraw the submission', async () => {
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

      // Mock pending submission
      SubmissionRedisService.getSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Test Submission',
        status: SubmissionStatus.PENDING
      });

      // Mock update
      SubmissionRedisService.updateSubmission.mockResolvedValue({
        id: 'sub-123',
        userId: 'test-user-123',
        title: 'Test Submission',
        status: SubmissionStatus.WITHDRAWN
      });

      const req = new NextRequest('https://example.com/api/sites/test-site/submissions/sub-123', {
        method: 'DELETE'
      });
      const params = { siteSlug: 'test-site', submissionId: 'sub-123' };

      const response = await DELETE(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Submission withdrawn successfully');
      expect(SubmissionRedisService.updateSubmission).toHaveBeenCalledWith(
        'test-site-123',
        'sub-123',
        expect.objectContaining({
          status: SubmissionStatus.WITHDRAWN
        })
      );
    });
  });
});
