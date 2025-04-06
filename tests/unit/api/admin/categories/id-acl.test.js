/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, PUT, DELETE } = require('@/app/api/admin/categories/[id]/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/categories/[id]',
  handler: GET,
  method: 'GET',
  resourceType: 'category',
  permission: 'read',
  params: { id: 'category-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test PUT endpoint
createAclTest({
  name: 'PUT /api/admin/categories/[id]',
  handler: PUT,
  method: 'PUT',
  resourceType: 'category',
  permission: 'update',
  params: { id: 'category-123' },
  requestBody: {
    name: 'Updated Category',
    slug: 'updated-category',
    description: 'An updated category for testing'
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test DELETE endpoint
createAclTest({
  name: 'DELETE /api/admin/categories/[id]',
  handler: DELETE,
  method: 'DELETE',
  resourceType: 'category',
  permission: 'delete',
  params: { id: 'category-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
