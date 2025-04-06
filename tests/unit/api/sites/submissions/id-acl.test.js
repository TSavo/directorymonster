/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers (these will be implemented later)
const { GET, PUT, DELETE } = require('@/app/api/sites/[siteSlug]/submissions/[submissionId]/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/sites/[siteSlug]/submissions/[submissionId]',
  handler: GET,
  method: 'GET',
  resourceType: 'submission',
  permission: 'read',
  params: { siteSlug: 'test-site', submissionId: 'submission-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test PUT endpoint
createAclTest({
  name: 'PUT /api/sites/[siteSlug]/submissions/[submissionId]',
  handler: PUT,
  method: 'PUT',
  resourceType: 'submission',
  permission: 'update',
  params: { siteSlug: 'test-site', submissionId: 'submission-123' },
  requestBody: {
    title: 'Updated Submission',
    description: 'An updated submission for testing',
    categoryIds: ['category-123']
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test DELETE endpoint
createAclTest({
  name: 'DELETE /api/sites/[siteSlug]/submissions/[submissionId]',
  handler: DELETE,
  method: 'DELETE',
  resourceType: 'submission',
  permission: 'delete',
  params: { siteSlug: 'test-site', submissionId: 'submission-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
