/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, PATCH, DELETE } = require('@/app/api/admin/submissions/[id]/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/submissions/[id]',
  handler: GET,
  method: 'GET',
  resourceType: 'submission',
  permission: 'read',
  params: { id: 'submission-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test PATCH endpoint
createAclTest({
  name: 'PATCH /api/admin/submissions/[id]',
  handler: PATCH,
  method: 'PATCH',
  resourceType: 'submission',
  permission: 'update',
  params: { id: 'submission-123' },
  requestBody: {
    status: 'approved',
    reviewNotes: 'Looks good!'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test DELETE endpoint
createAclTest({
  name: 'DELETE /api/admin/submissions/[id]',
  handler: DELETE,
  method: 'DELETE',
  resourceType: 'submission',
  permission: 'delete',
  params: { id: 'submission-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
