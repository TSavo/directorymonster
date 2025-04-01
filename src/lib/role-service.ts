/**
 * Role Service
 * 
 * This is a proxy file that re-exports the functionality from the 
 * modular implementation in the role/ directory.
 * 
 * This file exists for backward compatibility with existing code.
 * New code should import directly from '@/lib/role'.
 */

import { RoleService } from './role';

export { RoleService };
export default RoleService;
