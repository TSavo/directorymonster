/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET } = require('@/app/api/admin/roles/global/[id]/users/route');

// Test GET users with global role endpoint
createAclTest({
  name: 'GET /api/admin/roles/global/[id]/users',
  handler: GET,
  method: 'GET',
  resourceType: 'role',
  permission: 'read',
  params: { id: 'role-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
