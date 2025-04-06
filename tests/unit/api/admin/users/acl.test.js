/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { POST } = require('@/app/api/admin/users/route');

// Test POST endpoint
createAclTest({
  name: 'POST /api/admin/users',
  handler: POST,
  method: 'POST',
  resourceType: 'user',
  permission: 'create',
  requestBody: {
    name: 'New User',
    email: 'newuser@example.com',
    password: 'securePassword123',
    siteIds: ['site-123']
  }
});
