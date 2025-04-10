/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { GET } = require('@/app/api/admin/security/metrics/route');

// Test metrics endpoint
createAclTest({
  name: 'GET /api/admin/security/metrics',
  handler: GET,
  method: 'GET',
  resourceType: 'security',
  permission: 'read'
});
