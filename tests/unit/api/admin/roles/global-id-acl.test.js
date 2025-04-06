/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, PATCH, DELETE } = require('@/app/api/admin/roles/global/[id]/route');

// Test GET global role endpoint
createAclTest({
  name: 'GET /api/admin/roles/global/[id]',
  handler: GET,
  method: 'GET',
  resourceType: 'role',
  permission: 'read',
  params: { id: 'role-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test PATCH global role endpoint
createAclTest({
  name: 'PATCH /api/admin/roles/global/[id]',
  handler: PATCH,
  method: 'PATCH',
  resourceType: 'role',
  permission: 'update',
  params: { id: 'role-123' },
  requestBody: {
    name: 'Updated Role',
    description: 'An updated role'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test DELETE global role endpoint
createAclTest({
  name: 'DELETE /api/admin/roles/global/[id]',
  handler: DELETE,
  method: 'DELETE',
  resourceType: 'role',
  permission: 'delete',
  params: { id: 'role-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
