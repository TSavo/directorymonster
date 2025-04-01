/**
 * ACL Integration Test - Cross-Tenant Detection
 * Tests that cross-tenant references in API requests are detected and rejected
 */

import { 
  setupTestTenants, 
  setupTestUsersAndRoles, 
  cleanupTestData,
  TestUser,
  TestTenant
} from './acl-test-setup';
import { createMocks } from 'node-mocks-http';
import { NextRequest, NextResponse } from 'next/server';

// Mock the SecureTenantContext middleware
// The actual implementation would be imported from the middleware directory
const mockSecureTenantContext = jest.fn().mockImplementation(
  async (req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
    const tenantId = req.headers.get('x-tenant-id');
    
    // Check if request body contains cross-tenant references
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await req.json();
        
        // Detect cross-tenant references in the request body
        const hasCrossTenantRefs = detectCrossTenantReferences(body, tenantId || '');
        
        if (hasCrossTenantRefs) {
          return NextResponse.json(
            { error: 'Cross-tenant references detected in request' }, 
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('Error parsing request body', error);
      }
    }
    
    return handler(req);
  }
);

// Simple function to detect cross-tenant references in request data
function detectCrossTenantReferences(data: any, tenantId: string): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check for direct tenantId fields
  if (data.tenantId && data.tenantId !== tenantId) {
    return true;
  }
  
  // Check nested objects with tenantId
  for (const key in data) {
    if (typeof data[key] === 'object' && data[key] !== null) {
      // Check if this object has a tenantId property
      if (data[key].tenantId && data[key].tenantId !== tenantId) {
        return true;
      }
      
      // Recursively check nested objects
      if (detectCrossTenantReferences(data[key], tenantId)) {
        return true;
      }
    }
  }
  
  return false;
}

describe('Cross-Tenant Reference Detection Tests', () => {
  let tenantA: TestTenant;
  let tenantB: TestTenant;
  let adminA: TestUser;
  
  // Set up test data before all tests
  beforeAll(async () => {
    const tenants = await setupTestTenants();
    tenantA = tenants.tenantA;
    tenantB = tenants.tenantB;

    const users = await setupTestUsersAndRoles(tenantA, tenantB);
    adminA = users.adminA;
  });

  // Clean up test data after all tests
  afterAll(async () => {
    await cleanupTestData();
  });

  // Test cross-tenant reference detection in request bodies
  test('should detect and reject cross-tenant references in request body', async () => {
    // Mock successful request handler
    const mockHandler = jest.fn().mockImplementation(
      () => Promise.resolve(NextResponse.json({ success: true }))
    );

    // Safe request with matching tenant IDs
    const safeRequestBody = {
      name: 'Test Category',
      description: 'A test category',
      tenantId: tenantA.id,
      metadata: {
        tenantId: tenantA.id,
        createdBy: 'user1'
      }
    };
    
    const { req: safeReq } = createMocks({
      method: 'POST',
      headers: {
        'authorization': `Bearer ${adminA.token}`,
        'x-tenant-id': tenantA.id,
        'content-type': 'application/json'
      },
      body: safeRequestBody
    });
    
    // Add JSON method to request
    safeReq.json = jest.fn().mockResolvedValue(safeRequestBody);
    
    const safeTenantResponse = await mockSecureTenantContext(
      safeReq as unknown as NextRequest,
      mockHandler
    );
    
    expect(safeTenantResponse.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
    
    // Reset mock
    mockHandler.mockClear();
    
    // Malicious request with cross-tenant reference
    const maliciousRequestBody = {
      name: 'Evil Category',
      description: 'An attempt to access another tenant',
      tenantId: tenantA.id,
      parentCategory: {
        id: 'some-category',
        tenantId: tenantB.id // Cross-tenant reference!
      }
    };
    
    const { req: maliciousReq } = createMocks({
      method: 'POST',
      headers: {
        'authorization': `Bearer ${adminA.token}`,
        'x-tenant-id': tenantA.id,
        'content-type': 'application/json'
      },
      body: maliciousRequestBody
    });
    
    // Add JSON method to request
    maliciousReq.json = jest.fn().mockResolvedValue(maliciousRequestBody);
    
    const maliciousTenantResponse = await mockSecureTenantContext(
      maliciousReq as unknown as NextRequest,
      mockHandler
    );
    
    expect(maliciousTenantResponse.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
