/**
 * Simple utility to check if test sites exist in Redis
 * This is a lightweight version of verify-seed-data.js
 */

const Redis = require('ioredis');

// Configure Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

// Test site slugs to check
const siteData = [
  {
    slug: 'fishing-gear',
    domains: ['fishing-gear.mydirectory.com', 'fishinggearreviews.com']
  },
  {
    slug: 'hiking-gear',
    domains: ['hiking-gear.mydirectory.com', 'hikinggearreviews.com']
  }
];

// Check if sites exist
async function checkSites() {
  try {
    console.log('Checking Redis for test sites...');
    
    // Check Redis connection
    const pingResult = await redis.ping();
    console.log(`Redis connection check: ${pingResult}`);
    
    // Get all site and domain keys
    console.log('\nAll Site Keys:');
    const siteKeys = await redis.keys('site:*');
    console.log(siteKeys);
    
    console.log('\nAll Domain Keys:');
    const domainKeys = await redis.keys('domain:*');
    console.log(domainKeys);
    
    // Check each site
    console.log('\nChecking individual sites:');
    for (const site of siteData) {
      const siteKey = `site:${site.slug}`;
      const siteExists = await redis.exists(siteKey);
      console.log(`${siteKey}: ${siteExists ? 'EXISTS' : 'MISSING'}`);
      
      if (siteExists) {
        const siteContent = await redis.get(siteKey);
        console.log(`Site data: ${siteContent.substring(0, 100)}...`);
      }
      
      // Check domains
      for (const domain of site.domains) {
        const domainKey = `domain:${domain}`;
        const domainExists = await redis.exists(domainKey);
        console.log(`${domainKey}: ${domainExists ? 'EXISTS' : 'MISSING'}`);
        
        if (domainExists) {
          const siteId = await redis.get(domainKey);
          console.log(`Domain maps to: ${siteId}`);
        }
      }
    }
    
    console.log('\nCheck complete.');
  } catch (error) {
    console.error('Error checking test sites:', error);
  } finally {
    redis.quit();
  }
}

// Run the check
checkSites();
