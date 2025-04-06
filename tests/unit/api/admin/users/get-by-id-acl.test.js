/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { GET } = require('@/app/api/admin/users/[id]/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/users/[id]',
  handler: GET,
  method: 'GET',
  resourceType: 'user',
  permission: 'read',
  params: { id: 'user-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
