/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { POST } = require('@/app/api/admin/roles/global/[id]/remove/route');

// Test POST remove global role endpoint
createAclTest({
  name: 'POST /api/admin/roles/global/[id]/remove',
  handler: POST,
  method: 'POST',
  resourceType: 'role',
  permission: 'update',
  params: { id: 'role-123' },
  requestBody: {
    userId: 'user-123',
    tenantId: 'tenant-123'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
