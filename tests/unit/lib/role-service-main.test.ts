/**
 * Main entry point for RoleService tests
 * 
 * This file imports all the individual test files to make it easier to run all tests at once.
 */

// Import all test files
import './role-service/crud.test';
import './role-service/user-roles.test';
import './role-service/multiple-roles-users.test';
import './role-service/global-roles.test';
import './role-service/tenant-isolation.test';
import './role-service/audit-integration.test';
import './role-service/audit-operations.test';
import './role-service/audit-permissions.test';
import './role-service/audit-simple.test';
import './role-service/audit-skip.test';

// Note: Permission checking tests are skipped for now as they require more complex setup