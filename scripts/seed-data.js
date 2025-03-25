// Create a memory-backed Redis mock for seeding data
const memoryStore = new Map();
const redis = {
  set: async (key, value) => {
    memoryStore.set(key, value);
    return 'OK';
  },
  get: async (key) => memoryStore.get(key),
  sadd: async (key, ...values) => {
    if (!memoryStore.has(key)) {
      memoryStore.set(key, new Set());
    }
    const set = memoryStore.get(key);
    values.forEach(v => set.add(v));
    return values.length;
  },
  keys: async (pattern) => {
    const wildcard = pattern.includes('*');
    const prefix = pattern.replace('*', '');
    return Array.from(memoryStore.keys()).filter(k => 
      wildcard ? k.startsWith(prefix) : k === pattern
    );
  },
  ping: async () => 'PONG',
};

async function seedData() {
  console.log('🌱 Seeding sample data...');

  // Create a sample site
  const siteTimestamp = Date.now();
  const site = {
    id: `site_${siteTimestamp}`,
    name: 'Fishing Gear Reviews',
    slug: 'fishing-gear',
    domain: 'fishinggearreviews.com',
    primaryKeyword: 'fishing equipment reviews',
    metaDescription: 'Expert reviews of the best fishing gear and equipment for anglers of all levels',
    headerText: 'Expert Fishing Gear Reviews',
    defaultLinkAttributes: 'dofollow',
    createdAt: siteTimestamp,
    updatedAt: siteTimestamp,
  };

  // Store site in Redis
  await redis.set(`site:id:${site.id}`, JSON.stringify(site));
  await redis.set(`site:slug:${site.slug}`, JSON.stringify(site));
  await redis.set(`site:domain:${site.domain}`, JSON.stringify(site));

  console.log(`✅ Created site: ${site.name} (${site.slug})`);

  // Create sample categories
  const categories = [
    {
      id: 'category_1',
      siteId: site.id,
      name: 'Rods',
      slug: 'rods',
      metaDescription: 'Find the best fishing rods for every type of fishing',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'category_2',
      siteId: site.id,
      name: 'Reels',
      slug: 'reels',
      metaDescription: 'Explore top-rated fishing reels for freshwater and saltwater fishing',
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'category_3',
      siteId: site.id,
      name: 'Tackle',
      slug: 'tackle',
      metaDescription: 'Essential fishing tackle and accessories for your next fishing trip',
      order: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  // Store categories in Redis
  for (const category of categories) {
    await redis.set(`category:id:${category.id}`, JSON.stringify(category));
    await redis.set(`category:site:${site.id}:${category.slug}`, JSON.stringify(category));
    console.log(`✅ Created category: ${category.name}`);
  }

  // Create sample listings
  const listings = [
    {
      id: 'listing_1',
      siteId: site.id,
      categoryId: 'category_2',
      title: 'Shimano Stradic FL Spinning Reel Review',
      slug: 'shimano-stradic-fl-spinning-reel-review',
      metaDescription: 'In-depth review of the Shimano Stradic FL spinning reel with performance tests and durability analysis',
      content: 'The Shimano Stradic FL spinning reel offers exceptional performance for serious anglers...',
      imageUrl: 'https://example.com/images/shimano-stradic.jpg',
      backlinkUrl: 'https://fishingprostore.com/products/shimano-stradic',
      backlinkAnchorText: 'Shimano Stradic FL Spinning Reel',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
      customFields: {
        product_name: 'Shimano Stradic FL Spinning Reel',
        brand: 'Shimano',
        rating: 4.8,
        product_type: 'spinning-reel',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'listing_2',
      siteId: site.id,
      categoryId: 'category_1',
      title: 'St. Croix Legend X Casting Rod Review',
      slug: 'st-croix-legend-x-casting-rod-review',
      metaDescription: 'Comprehensive review of the St. Croix Legend X casting rod with field testing results',
      content: 'The St. Croix Legend X casting rod combines incredible sensitivity with remarkable strength...',
      imageUrl: 'https://example.com/images/st-croix-legend.jpg',
      backlinkUrl: 'https://fishingprostore.com/products/st-croix-legend',
      backlinkAnchorText: 'St. Croix Legend X Casting Rod',
      backlinkPosition: 'body',
      backlinkType: 'dofollow',
      customFields: {
        product_name: 'St. Croix Legend X Casting Rod',
        brand: 'St. Croix',
        rating: 4.9,
        product_type: 'casting-rod',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  // Store listings in Redis
  for (const listing of listings) {
    await redis.set(`listing:id:${listing.id}`, JSON.stringify(listing));
    await redis.set(`listing:site:${site.id}:${listing.slug}`, JSON.stringify(listing));
    await redis.set(`listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
    
    // Index the listing for search
    // Extract search terms from the listing
    const searchTerms = extractSearchTerms(listing);
    
    // Add listing ID to each search term set
    for (const term of searchTerms) {
      // Store site-specific search term
      await redis.sadd(`search:${listing.siteId}:term:${term.toLowerCase()}`, listing.id);
      
      // Store global search term
      await redis.sadd(`search:global:term:${term.toLowerCase()}`, listing.id);
    }
    
    // Store a list of all search terms for this listing (for removal later)
    await redis.sadd(`search:listing:${listing.id}:terms`, ...searchTerms.map(t => t.toLowerCase()));
    
    console.log(`✅ Created and indexed listing: ${listing.title}`);
  }
  
  // Create a second site for hiking gear
  const hikingSiteTimestamp = Date.now();
  const hikingSite = {
    id: `site_${hikingSiteTimestamp}`,
    name: 'Hiking Gear Directory',
    slug: 'hiking-gear',
    domain: 'hikinggearreviews.com',
    primaryKeyword: 'hiking gear reviews',
    metaDescription: 'Find the best hiking gear with our expert guides and reviews',
    headerText: 'Hiking Gear Reviews & Guides',
    defaultLinkAttributes: 'dofollow',
    createdAt: hikingSiteTimestamp,
    updatedAt: hikingSiteTimestamp,
  };

  // Store hiking site in Redis
  await redis.set(`site:id:${hikingSite.id}`, JSON.stringify(hikingSite));
  await redis.set(`site:slug:${hikingSite.slug}`, JSON.stringify(hikingSite));
  await redis.set(`site:domain:${hikingSite.domain}`, JSON.stringify(hikingSite));

  console.log(`✅ Created site: ${hikingSite.name} (${hikingSite.slug})`);

  // Create sample hiking categories
  const hikingCategories = [
    {
      id: 'hiking_category_1',
      siteId: hikingSite.id,
      name: 'Backpacks',
      slug: 'backpacks',
      metaDescription: 'Find the perfect hiking backpack for your adventures',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'hiking_category_2',
      siteId: hikingSite.id,
      name: 'Footwear',
      slug: 'footwear',
      metaDescription: 'Hiking boots and shoes for all terrains and conditions',
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];

  // Store hiking categories in Redis
  for (const category of hikingCategories) {
    await redis.set(`category:id:${category.id}`, JSON.stringify(category));
    await redis.set(`category:site:${hikingSite.id}:${category.slug}`, JSON.stringify(category));
    console.log(`✅ Created hiking category: ${category.name}`);
  }

  // Create sample hiking listings
  const hikingListings = [
    {
      id: 'hiking_listing_1',
      siteId: hikingSite.id,
      categoryId: 'hiking_category_1',
      title: 'Osprey Atmos AG 65 Backpack Review',
      slug: 'osprey-atmos-ag-65-backpack-review',
      metaDescription: 'Comprehensive review of the Osprey Atmos AG 65 backpack for multi-day hiking trips',
      content: 'The Osprey Atmos AG 65 backpack combines comfort with ample storage for extended trips...',
      imageUrl: 'https://example.com/images/osprey-atmos.jpg',
      backlinkUrl: 'https://hikinggearstore.com/products/osprey-atmos',
      backlinkAnchorText: 'Osprey Atmos AG 65 Backpack',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
      customFields: {
        product_name: 'Osprey Atmos AG 65 Backpack',
        brand: 'Osprey',
        rating: 4.7,
        product_type: 'backpack',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];

  // Store hiking listings in Redis
  for (const listing of hikingListings) {
    await redis.set(`listing:id:${listing.id}`, JSON.stringify(listing));
    await redis.set(`listing:site:${hikingSite.id}:${listing.slug}`, JSON.stringify(listing));
    await redis.set(`listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
    
    const searchTerms = extractSearchTerms(listing);
    
    for (const term of searchTerms) {
      await redis.sadd(`search:${listing.siteId}:term:${term.toLowerCase()}`, listing.id);
      await redis.sadd(`search:global:term:${term.toLowerCase()}`, listing.id);
    }
    
    await redis.sadd(`search:listing:${listing.id}:terms`, ...searchTerms.map(t => t.toLowerCase()));
    
    console.log(`✅ Created and indexed hiking listing: ${listing.title}`);
  }
}

// Extract search terms from a listing
function extractSearchTerms(listing) {
  const terms = new Set();
  
  // Add title words
  listing.title.split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add meta description words
  listing.metaDescription.split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add custom fields
  if (listing.customFields) {
    for (const [key, value] of Object.entries(listing.customFields)) {
      if (typeof value === 'string' && value.length > 2) {
        terms.add(value);
      }
    }
  }
  
  return Array.from(terms);
}

// If this script is run directly, seed the data
if (require.main === module) {
  seedData().catch(error => {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  });
}

// Export the memoryStore and redis objects for other modules to use
module.exports = {
  memoryStore,
  redis,
  seedData
};