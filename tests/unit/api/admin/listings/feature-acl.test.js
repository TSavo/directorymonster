/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { POST } = require('@/app/api/admin/listings/[id]/feature/route');

// Test POST endpoint
createAclTest({
  name: 'POST /api/admin/listings/[id]/feature',
  handler: POST,
  method: 'POST',
  resourceType: 'listing',
  permission: 'feature',
  params: { id: 'listing-123' },
  requestBody: {
    featured: true,
    featuredUntil: '2023-12-31T23:59:59Z'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
