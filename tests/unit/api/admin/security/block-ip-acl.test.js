/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { POST } = require('@/app/api/admin/security/block-ip/route');

// Test block-ip endpoint
createAclTest({
  name: 'POST /api/admin/security/block-ip',
  handler: POST,
  method: 'POST',
  resourceType: 'security',
  permission: 'manage',
  requestBody: {
    ip: '192.168.1.1'
  }
});
