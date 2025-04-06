/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, POST } = require('@/app/api/admin/listings/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/listings',
  handler: GET,
  method: 'GET',
  resourceType: 'listing',
  permission: 'read'
});

// Test POST endpoint
createAclTest({
  name: 'POST /api/admin/listings',
  handler: POST,
  method: 'POST',
  resourceType: 'listing',
  permission: 'create',
  requestBody: {
    title: 'New Listing',
    description: 'A new listing for testing',
    categoryIds: ['category-123'],
    siteId: 'site-123'
  }
});
