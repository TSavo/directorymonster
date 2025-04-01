/**
 * Common test setup for secure tenant context testing
 */
import { TenantContext } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission, detectCrossTenantAccess } from '@/components/admin/auth/utils/accessControl';
import AuditService from '@/lib/audit/audit-service';
import RoleService from '@/lib/role-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { validate as validateUuid, v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';

// Valid UUIDs for testing
export const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
export const DIFFERENT_TENANT_ID = '650e8400-e29b-41d4-a716-446655440001';
export const USER_ID = 'user-123';
export const TEST_REQUEST_ID = '750e8400-e29b-41d4-a716-446655440002';

// Setup mocks
jest.mock('uuid', () => ({
  validate: jest.fn().mockReturnValue(true),
  v4: jest.fn().mockReturnValue('750e8400-e29b-41d4-a716-446655440002')
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ userId: 'user-123' }),
  JwtPayload: {}
}));

jest.mock('@/components/admin/auth/utils/accessControl', () => ({
  ResourceType: {
    USER: 'user',
    DOCUMENT: 'document',
    TENANT: 'tenant'
  },
  Permission: {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    ADMIN: 'admin'
  },
  detectCrossTenantAccess: jest.fn().mockReturnValue(false)
}));

jest.mock('@/lib/audit/audit-service', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/lib/role-service', () => ({
  hasPermission: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/lib/tenant-membership-service', () => ({
  isTenantMember: jest.fn().mockResolvedValue(true)
}));

// Define path segments for URL pathname mocking
export const pathSegments = [
  'api', 
  'tenants', 
  VALID_TENANT_ID, 
  'resources'
];

// Create a mock for URL
export const mockSearchParams = {
  get: jest.fn().mockReturnValue(null)
};

export const mockURL = {
  pathname: `/api/tenants/${VALID_TENANT_ID}/resources`,
  split: jest.fn().mockReturnValue(pathSegments),
  searchParams: mockSearchParams
};

// Store original implementations
export const originalConsoleError = console.error;
export const OriginalURL = globalThis.URL;

// Helper functions
export const setupURLMock = () => {
  Object.defineProperty(globalThis, 'URL', {
    value: jest.fn().mockImplementation(() => mockURL)
  });
};

export const resetURLMock = () => {
  Object.defineProperty(globalThis, 'URL', {
    value: OriginalURL
  });
};

// Create mock request helper
export const createMockRequest = (options: any = {}) => {
  const headers = new Map();
  headers.set('x-tenant-id', options.tenantId || VALID_TENANT_ID);
  headers.set('authorization', options.auth || 'Bearer valid-token');
  
  const url = options.url || `https://example.com/api/tenants/${options.tenantId || VALID_TENANT_ID}/resources`;
  
  return {
    headers: {
      get: (name: string) => headers.get(name)
    },
    method: options.method || 'POST',
    url,
    clone: jest.fn().mockReturnValue({
      json: jest.fn().mockResolvedValue(options.body || {})
    })
  } as unknown as NextRequest;
};

// Create a handler mock helper
export const createHandlerMock = (returnValue = { success: true }) => {
  return jest.fn().mockImplementation(() => {
    return NextResponse.json(returnValue);
  });
};

// Setup function
export const setupTestEnvironment = () => {
  console.error = jest.fn();
  setupURLMock();
};

// Teardown function
export const teardownTestEnvironment = () => {
  console.error = originalConsoleError;
  resetURLMock();
  jest.clearAllMocks();
};
