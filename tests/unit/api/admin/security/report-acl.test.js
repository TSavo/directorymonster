/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { POST } = require('@/app/api/admin/security/report/route');

// Test report endpoint
createAclTest({
  name: 'POST /api/admin/security/report',
  handler: POST,
  method: 'POST',
  resourceType: 'security',
  permission: 'manage',
  requestBody: {
    activityType: 'suspicious_login',
    description: 'Multiple failed login attempts'
  }
});
