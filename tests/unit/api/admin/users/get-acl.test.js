/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { GET } = require('@/app/api/admin/users/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/users',
  handler: GET,
  method: 'GET',
  resourceType: 'user',
  permission: 'read'
});
