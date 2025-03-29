const Redis = require('ioredis');

// Configure Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

// Test sites data
const sites = [
  {
    id: 'fishing-gear',
    slug: 'fishing-gear',
    name: 'Fishing Gear Reviews',
    domains: ['fishing-gear.mydirectory.com', 'fishinggearreviews.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hiking-gear',
    slug: 'hiking-gear',
    name: 'Hiking Gear Reviews',
    domains: ['hiking-gear.mydirectory.com', 'hikinggearreviews.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Create domain mappings
const domainMappings = [];
sites.forEach(site => {
  site.domains.forEach(domain => {
    domainMappings.push({
      domain,
      siteId: site.id
    });
  });
});

// Save data to Redis
async function saveSites() {
  try {
    console.log('Saving test sites to Redis...');
    
    // Save each site
    for (const site of sites) {
      const siteKey = `site:${site.slug}`;
      await redis.set(siteKey, JSON.stringify(site));
      console.log(`Saved site: ${siteKey}`);
      
      // Also save by ID if different from slug
      if (site.id !== site.slug) {
        const siteIdKey = `site:id:${site.id}`;
        await redis.set(siteIdKey, JSON.stringify(site));
        console.log(`Saved site by ID: ${siteIdKey}`);
      }
    }
    
    // Save domain mappings
    for (const mapping of domainMappings) {
      const domainKey = `domain:${mapping.domain}`;
      await redis.set(domainKey, mapping.siteId);
      console.log(`Saved domain mapping: ${domainKey} -> ${mapping.siteId}`);
    }
    
    // Verify saved data
    const keys = await redis.keys('site:*');
    console.log(`Total site keys: ${keys.length}`);
    console.log('Site keys:', keys);
    
    const domainKeys = await redis.keys('domain:*');
    console.log(`Total domain keys: ${domainKeys.length}`);
    console.log('Domain keys:', domainKeys);
    
    console.log('Sites created successfully!');
  } catch (error) {
    console.error('Error creating test sites:', error);
  } finally {
    redis.quit();
  }
}

// Run the function
saveSites();
