const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function createSite() {
  console.log('🌱 Creating e-commerce site for product extraction...');

  // Create the site
  const siteTimestamp = Date.now();
  const site = {
    id: `site_${siteTimestamp}`,
    name: 'Unique Products Directory',
    slug: 'unique-products',
    domain: 'uniqueproductsdirectory.com',
    primaryKeyword: 'unique product listings and reviews',
    metaDescription: 'Discover unique and interesting products from around the web',
    headerText: 'Unique Products Directory',
    defaultLinkAttributes: 'dofollow',
    createdAt: siteTimestamp,
    updatedAt: siteTimestamp,
  };

  // Store site in Redis
  await redis.set(`site:id:${site.id}`, JSON.stringify(site));
  await redis.set(`site:slug:${site.slug}`, JSON.stringify(site));
  await redis.set(`site:domain:${site.domain}`, JSON.stringify(site));

  console.log(`✅ Created site: ${site.name} (${site.slug})`);
  console.log(`Site ID: ${site.id}`);

  // Create category
  const category = {
    id: `category_${siteTimestamp}`,
    siteId: site.id,
    name: 'Collectibles',
    slug: 'collectibles',
    metaDescription: 'Unique collectible items from around the web',
    order: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Store category in Redis
  await redis.set(`category:id:${category.id}`, JSON.stringify(category));
  await redis.set(`category:site:${site.id}:${category.slug}`, JSON.stringify(category));
  
  console.log(`✅ Created category: ${category.name}`);
  console.log(`Category ID: ${category.id}`);

  // Print the API information needed for the extractor
  console.log('\n---- API Configuration for extractor.py ----');
  console.log(`Site Slug: ${site.slug}`);
  console.log(`Category ID: ${category.id}`);
  console.log('API Key: dev-api-key (hardcoded for development)');
}

createSite().catch(error => {
  console.error('❌ Error creating site:', error);
  process.exit(1);
});