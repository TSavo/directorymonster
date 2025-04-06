/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers (these will be implemented later)
const { GET, POST } = require('@/app/api/sites/[siteSlug]/submissions/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/sites/[siteSlug]/submissions',
  handler: GET,
  method: 'GET',
  resourceType: 'submission',
  permission: 'read',
  params: { siteSlug: 'test-site' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test POST endpoint
createAclTest({
  name: 'POST /api/sites/[siteSlug]/submissions',
  handler: POST,
  method: 'POST',
  resourceType: 'submission',
  permission: 'create',
  params: { siteSlug: 'test-site' },
  requestBody: {
    title: 'New Submission',
    description: 'A new submission for testing',
    categoryIds: ['category-123']
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
