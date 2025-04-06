/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { POST: ApproveHandler } = require('@/app/api/admin/submissions/[id]/approve/route');
const { POST: RejectHandler } = require('@/app/api/admin/submissions/[id]/reject/route');

// Test approve endpoint
createAclTest({
  name: 'POST /api/admin/submissions/[id]/approve',
  handler: ApproveHandler,
  method: 'POST',
  resourceType: 'submission',
  permission: 'approve',
  params: { id: 'submission-123' },
  requestBody: {
    reviewNotes: 'Approved - looks good!'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test reject endpoint
createAclTest({
  name: 'POST /api/admin/submissions/[id]/reject',
  handler: RejectHandler,
  method: 'POST',
  resourceType: 'submission',
  permission: 'reject',
  params: { id: 'submission-123' },
  requestBody: {
    reviewNotes: 'Rejected - needs more information'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
