/**
 * Redis Seed Script
 * 
 * This script seeds Redis with initial data required for the application to function.
 * It should be run after starting the Redis container but before running E2E tests.
 */

const Redis = require('ioredis');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_SITE_DOMAIN = 'fishinggearreviews.com';
const DEFAULT_SITE_NAME = 'Fishing Gear Reviews';

// Connect to Redis
console.log(`Connecting to Redis at ${REDIS_URL}...`);
const redis = new Redis(REDIS_URL);

// Initial site data
const initialSite = {
  id: 'site_fishing',
  name: DEFAULT_SITE_NAME,
  slug: 'fishing-gear-reviews',
  domain: DEFAULT_SITE_DOMAIN,
  description: 'Reviews and information about fishing gear and equipment',
  active: true,
  created_at: Date.now(),
  updated_at: Date.now(),
  settings: {
    theme: 'default',
    colors: {
      primary: '#0088cc',
      secondary: '#005580',
      accent: '#e6f7ff'
    },
    layout: 'standard',
    seo: {
      title: DEFAULT_SITE_NAME,
      description: 'The best reviews of fishing gear and equipment on the web',
      keywords: 'fishing, gear, reviews, equipment, tackle, rods, reels'
    }
  }
};

// Initial admin user
const adminUser = {
  id: 'user_admin',
  username: 'admin',
  email: 'admin@example.com',
  password_hash: '$2b$10$eSgldqGlxJvgx6.bCDxT9OBu1hPKLXn7ij9YAXWJMnI1bEZP7q3ga', // password123456
  role: 'admin',
  created_at: Date.now(),
  updated_at: Date.now(),
  sites: ['site_fishing']
};

// Initial category
const fishingCategory = {
  id: 'category_fishing_rods',
  name: 'Fishing Rods',
  slug: 'fishing-rods',
  description: 'Reviews and information about fishing rods',
  site_id: 'site_fishing',
  parent_id: null,
  created_at: Date.now(),
  updated_at: Date.now(),
  position: 1,
  active: true
};

// Initial listing
const fishingListing = {
  id: 'listing_premium_rod',
  title: 'Premium Fishing Rod',
  slug: 'premium-fishing-rod',
  description: 'This premium fishing rod is perfect for both beginners and experts',
  content: 'Full review of the Premium Fishing Rod, including pros, cons, and detailed specifications.',
  site_id: 'site_fishing',
  category_id: 'category_fishing_rods',
  created_at: Date.now(),
  updated_at: Date.now(),
  active: true,
  featured: true,
  price: {
    amount: 149.99,
    currency: 'USD'
  },
  metadata: {
    brand: 'FishPro',
    material: 'Carbon Fiber',
    length: '7 feet',
    weight: '5.2 ounces'
  }
};

// Domain mapping
const domainMapping = {
  domain: DEFAULT_SITE_DOMAIN,
  site_id: 'site_fishing',
  primary: true,
  created_at: Date.now(),
  updated_at: Date.now()
};

// Default site setting
const defaultSiteSetting = {
  key: 'default_site',
  value: 'site_fishing'
};

// Function to seed data
async function seedData() {
  try {
    console.log('Testing Redis connection...');
    await redis.ping();
    console.log('Redis connection successful!');
    
    console.log('Checking if data already exists...');
    const siteExists = await redis.exists('site:site_fishing');
    
    if (siteExists) {
      console.log('Data already exists in Redis. Skipping seed.');
      return;
    }
    
    console.log('Seeding initial data...');
    
    // Store site data
    console.log('- Adding site data');
    await redis.set(`site:${initialSite.id}`, JSON.stringify(initialSite));
    await redis.set(`site_by_domain:${initialSite.domain}`, initialSite.id);
    await redis.set(`site_by_slug:${initialSite.slug}`, initialSite.id);
    
    // Store user data
    console.log('- Adding user data');
    await redis.set(`user:${adminUser.id}`, JSON.stringify(adminUser));
    await redis.set(`user_by_username:${adminUser.username}`, adminUser.id);
    await redis.set(`user_by_email:${adminUser.email}`, adminUser.id);
    
    // Store category data
    console.log('- Adding category data');
    await redis.set(`category:${fishingCategory.id}`, JSON.stringify(fishingCategory));
    await redis.set(`category_by_slug:${fishingCategory.site_id}:${fishingCategory.slug}`, fishingCategory.id);
    await redis.sadd(`site:${fishingCategory.site_id}:categories`, fishingCategory.id);
    
    // Store listing data
    console.log('- Adding listing data');
    await redis.set(`listing:${fishingListing.id}`, JSON.stringify(fishingListing));
    await redis.set(`listing_by_slug:${fishingListing.site_id}:${fishingListing.slug}`, fishingListing.id);
    await redis.sadd(`site:${fishingListing.site_id}:listings`, fishingListing.id);
    await redis.sadd(`category:${fishingListing.category_id}:listings`, fishingListing.id);
    
    // Store domain mapping
    console.log('- Adding domain mapping');
    await redis.set(`domain:${domainMapping.domain}`, JSON.stringify(domainMapping));
    
    // Store default site setting
    console.log('- Adding default site setting');
    await redis.set(`setting:${defaultSiteSetting.key}`, defaultSiteSetting.value);
    
    // Add user to site
    console.log('- Adding user to site relationship');
    await redis.sadd(`site:${initialSite.id}:users`, adminUser.id);
    await redis.sadd(`user:${adminUser.id}:sites`, initialSite.id);
    
    // Add index records for search
    console.log('- Adding search indices');
    await redis.sadd('all_sites', initialSite.id);
    await redis.sadd('all_users', adminUser.id);
    await redis.sadd('all_categories', fishingCategory.id);
    await redis.sadd('all_listings', fishingListing.id);
    
    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Close Redis connection
    redis.quit();
  }
}

// Run the seed function
seedData().then(() => {
  console.log('Redis seed script finished');
});
