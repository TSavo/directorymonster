/**
 * Mock implementation for the secureTenantContext module
 * This file is automatically loaded by Jest when the module is imported
 */

import { MockTenantContext, createSecurityMiddlewareMock } from '../../../../tests/unit/middleware/__utils__/secure-tenant-context-test-utils';

// Create the middleware mock
const securityMiddlewareMock = createSecurityMiddlewareMock();

// Export the mock functions and objects
export const TenantContext = MockTenantContext;
export const withSecureTenantContext = securityMiddlewareMock.withSecureTenantContext;
export const withSecureTenantPermission = securityMiddlewareMock.withSecureTenantPermission;

// Export the mock controller for test use
export const __securityMiddlewareMock = securityMiddlewareMock;