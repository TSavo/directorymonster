/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { GET, POST } = require('@/app/api/admin/categories/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/categories',
  handler: GET,
  method: 'GET',
  resourceType: 'category',
  permission: 'read'
});

// Test POST endpoint
createAclTest({
  name: 'POST /api/admin/categories',
  handler: POST,
  method: 'POST',
  resourceType: 'category',
  permission: 'create',
  requestBody: {
    name: 'New Category',
    slug: 'new-category',
    description: 'A new category for testing'
  }
});
