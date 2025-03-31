/**
 * Unit tests for Global Role functionality
 * 
 * This minimal test file focuses on just one test to verify
 * the basic global roles functionality.
 */

import { describe, it, expect } from '@jest/globals';
import { RoleService } from '@/lib/role-service';

describe('RoleService - Global Roles', () => {
  it('should be defined and have global roles methods', () => {
    expect(RoleService).toBeDefined();
    expect(typeof RoleService.createGlobalRole).toBe('function');
    expect(typeof RoleService.getGlobalRole).toBe('function');
    expect(typeof RoleService.getGlobalRoles).toBe('function');
    expect(typeof RoleService.getUserGlobalRoles).toBe('function');
    expect(typeof RoleService.hasGlobalPermission).toBe('function');
  });
});
