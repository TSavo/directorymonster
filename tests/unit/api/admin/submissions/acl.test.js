/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, POST } = require('@/app/api/admin/submissions/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/submissions',
  handler: GET,
  method: 'GET',
  resourceType: 'submission',
  permission: 'read'
});

// Test POST endpoint
createAclTest({
  name: 'POST /api/admin/submissions',
  handler: POST,
  method: 'POST',
  resourceType: 'submission',
  permission: 'create',
  requestBody: {
    title: 'New Submission',
    description: 'A new submission for testing',
    categoryId: 'category-123'
  }
});
