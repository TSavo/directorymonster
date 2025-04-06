/**
 * @jest-environment node
 */

// Import the test harness
const { createAclTest } = require('../../../utils/aclTestHarness');

// Import the handlers
const { GET, PUT, DELETE } = require('@/app/api/admin/listings/[id]/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/admin/listings/[id]',
  handler: GET,
  method: 'GET',
  resourceType: 'listing',
  permission: 'read',
  params: { id: 'listing-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test PUT endpoint
createAclTest({
  name: 'PUT /api/admin/listings/[id]',
  handler: PUT,
  method: 'PUT',
  resourceType: 'listing',
  permission: 'update',
  params: { id: 'listing-123' },
  requestBody: {
    title: 'Updated Listing',
    description: 'An updated listing for testing',
    categoryIds: ['category-123']
  },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});

// Test DELETE endpoint
createAclTest({
  name: 'DELETE /api/admin/listings/[id]',
  handler: DELETE,
  method: 'DELETE',
  resourceType: 'listing',
  permission: 'delete',
  params: { id: 'listing-123' },
  invokeHandler: (handler, req, params) => {
    return handler(req, { params });
  }
});
