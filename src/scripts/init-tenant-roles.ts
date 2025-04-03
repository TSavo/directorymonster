#!/usr/bin/env node

/**
 * Script to initialize predefined roles for a tenant
 *
 * Usage:
 * - Tenant roles only: npx ts-node src/scripts/init-tenant-roles.ts <tenantId>
 * - Tenant and site roles: npx ts-node src/scripts/init-tenant-roles.ts <tenantId> <siteId>
 * - Site roles only: npx ts-node src/scripts/init-tenant-roles.ts <tenantId> <siteId> --site-only
 */

import { PredefinedRoles } from '../lib/role/predefined-roles';

async function main() {
  try {
    // Get command line arguments
    const tenantId = process.argv[2];
    const siteId = process.argv[3];
    const siteOnly = process.argv.includes('--site-only');

    if (!tenantId) {
      console.error('Error: Tenant ID is required');
      console.error('Usage: npx ts-node src/scripts/init-tenant-roles.ts <tenantId> [<siteId>] [--site-only]');
      process.exit(1);
    }

    if ((siteOnly || process.argv.length > 3) && !siteId) {
      console.error('Error: Site ID is required when using --site-only flag');
      console.error('Usage: npx ts-node src/scripts/init-tenant-roles.ts <tenantId> <siteId> [--site-only]');
      process.exit(1);
    }

    let roles = [];

    if (siteId && siteOnly) {
      // Create site-specific roles only
      console.log(`Initializing site-specific roles for tenant: ${tenantId}, site: ${siteId}`);
      roles = await PredefinedRoles.createSiteRoles(tenantId, siteId);
    } else if (siteId) {
      // Create both tenant-wide and site-specific roles
      console.log(`Initializing all roles for tenant: ${tenantId}, site: ${siteId}`);
      roles = await PredefinedRoles.createAllRoles(tenantId, siteId);
    } else {
      // Create tenant-wide roles only
      console.log(`Initializing tenant-wide roles for tenant: ${tenantId}`);
      roles = await PredefinedRoles.createTenantRoles(tenantId);
    }

    console.log(`Successfully created ${roles.length} predefined roles:`);

    // Group roles by type for better readability
    const tenantRoles = roles.filter(role => role.name.startsWith('Tenant '));
    const siteRoles = roles.filter(role => role.name.startsWith('Site '));

    if (tenantRoles.length > 0) {
      console.log('\nTenant-wide roles:');
      tenantRoles.forEach(role => {
        console.log(`- ${role.name}: ${role.id}`);
      });
    }

    if (siteRoles.length > 0) {
      console.log('\nSite-specific roles:');
      siteRoles.forEach(role => {
        console.log(`- ${role.name}: ${role.id}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error initializing predefined roles:', error);
    process.exit(1);
  }
}

// Run the script
main();
