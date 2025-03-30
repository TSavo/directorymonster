/**
 * Script to set the default site for the DirectoryMonster platform
 * 
 * Usage: node scripts/set-default-site.js <site-slug>
 * Example: node scripts/set-default-site.js hiking-gear
 */

const { kv } = require('../src/lib/redis-client');

async function setDefaultSite(siteSlug) {
  try {
    // Check if the site exists
    const site = await kv.get(`site:slug:${siteSlug}`);
    if (!site) {
      console.error(`Error: Site with slug "${siteSlug}" not found.`);
      console.log('Available sites:');
      
      // List available sites
      const siteKeys = await kv.keys('site:slug:*');
      for (const key of siteKeys) {
        const slug = key.replace('site:slug:', '');
        const site = await kv.get(key);
        console.log(`- ${slug} (${site?.name || 'Unknown name'})`);
      }
      
      process.exit(1);
    }
    
    // Set the default site
    await kv.set('config:default-site', siteSlug);
    console.log(`Successfully set default site to "${siteSlug}" (${site.name})`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting default site:', error);
    process.exit(1);
  }
}

// Get site slug from command line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: node scripts/set-default-site.js <site-slug>');
  console.error('Example: node scripts/set-default-site.js hiking-gear');
  process.exit(1);
}

// Run the script
setDefaultSite(args[0]);
