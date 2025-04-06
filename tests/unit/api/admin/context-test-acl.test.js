/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../utils/aclTestHarness');

// Import the handlers
const { GET, POST } = require('@/app/api/admin/context-test/route');

// Test GET context-test endpoint
createAclTest({
  name: 'GET /api/admin/context-test',
  handler: GET,
  method: 'GET',
  resourceType: 'setting',
  permission: 'read'
});

// Test POST context-test endpoint
createAclTest({
  name: 'POST /api/admin/context-test',
  handler: POST,
  method: 'POST',
  resourceType: 'setting',
  permission: 'read'
});
