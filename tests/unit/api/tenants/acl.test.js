/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../utils/aclTestHarness');

// Import the handlers
const { GET, POST } = require('@/app/api/tenants/route');
const { GET: GetUserTenantsHandler } = require('@/app/api/tenants/user/route');
const { GET: GetTenantSitesHandler } = require('@/app/api/tenants/[id]/sites/route');

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

// Test GET user tenants endpoint
createAclTest({
  name: 'GET /api/tenants/user',
  handler: GetUserTenantsHandler,
  method: 'GET',
  resourceType: 'tenant',
  permission: 'read'
});

// Test GET tenant sites endpoint
createAclTest({
  name: 'GET /api/tenants/[id]/sites',
  handler: GetTenantSitesHandler,
  method: 'GET',
  resourceType: 'site',
  permission: 'read',
  // Custom handler invocation to pass route params
  invokeHandler: async (handler, req, params) => {
    return handler(req, { params: { id: params.id } });
  }
});
