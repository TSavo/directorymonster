/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { DELETE } = require('@/app/api/admin/users/[id]/route');

// Test DELETE endpoint
createAclTest({
  name: 'DELETE /api/admin/users/[id]',
  handler: DELETE,
  method: 'DELETE',
  resourceType: 'user',
  permission: 'delete',
  params: { id: 'user-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
