/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET } = require('@/app/api/admin/context-test/route');

// Test context-test endpoint
createAclTest({
  name: 'GET /api/admin/context-test',
  handler: GET,
  method: 'GET',
  resourceType: 'setting',
  permission: 'read'
});
