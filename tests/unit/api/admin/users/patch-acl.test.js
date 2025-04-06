/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { PATCH } = require('@/app/api/admin/users/[id]/route');

// Test PATCH endpoint
createAclTest({
  name: 'PATCH /api/admin/users/[id]',
  handler: PATCH,
  method: 'PATCH',
  resourceType: 'user',
  permission: 'update',
  params: { id: 'user-123' },
  requestBody: {
    name: 'Updated User',
    email: 'updated@example.com'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
