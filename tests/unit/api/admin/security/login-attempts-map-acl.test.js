/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handler
const { GET } = require('@/app/api/admin/security/login-attempts-map/route');

// Test login-attempts-map endpoint
createAclTest({
  name: 'GET /api/admin/security/login-attempts-map',
  handler: GET,
  method: 'GET',
  resourceType: 'security',
  permission: 'read'
});
