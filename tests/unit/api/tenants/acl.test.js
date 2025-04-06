/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../utils/aclTestHarness');

// Import the handlers
const { GET, POST } = require('@/app/api/tenants/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/tenants',
  handler: GET,
  method: 'GET',
  resourceType: 'tenant',
  permission: 'read'
});

// Test POST endpoint
createAclTest({
  name: 'POST /api/tenants',
  handler: POST,
  method: 'POST',
  resourceType: 'tenant',
  permission: 'create',
  requestBody: {
    name: 'New Tenant',
    slug: 'new-tenant',
    hostnames: ['new-tenant.example.com']
  }
});
