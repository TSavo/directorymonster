/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, POST } = require('@/app/api/admin/roles/global/route');

// Test GET global roles endpoint
createAclTest({
  name: 'GET /api/admin/roles/global',
  handler: GET,
  method: 'GET',
  resourceType: 'role',
  permission: 'read'
});

// Test POST global roles endpoint
createAclTest({
  name: 'POST /api/admin/roles/global',
  handler: POST,
  method: 'POST',
  resourceType: 'role',
  permission: 'create',
  requestBody: {
    name: 'Test Role',
    description: 'A test role',
    permissions: ['user:read', 'category:read']
  }
});
