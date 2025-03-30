// Simple API-based seeding script in JavaScript (no TypeScript)
const axios = require('axios');

// Base URL for API requests 
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Create a site via the API
 */
async function createSite(siteData) {
  try {
    console.log(`Creating site: ${siteData.name}...`);
    const response = await axios.post(`${API_BASE_URL}/sites`, siteData);
    console.log(`✅ Created site: ${response.data.name} (${response.data.slug})`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === 'Site slug already exists') {
      console.log(`Site ${siteData.slug} already exists, retrieving...`);
      // Try to fetch the existing site
      const sitesResponse = await axios.get(`${API_BASE_URL}/sites`);
      const existingSite = sitesResponse.data.find(site => site.slug === siteData.slug);
      if (existingSite) {
        console.log(`Retrieved existing site: ${existingSite.name}`);
        return existingSite;
      }
    }
    console.error(`❌ Error creating site:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a category via the API
 */
async function createCategory(siteSlug, categoryData) {
  try {
    console.log(`Creating category: ${categoryData.name}...`);
    const response = await axios.post(`${API_BASE_URL}/sites/${siteSlug}/categories`, categoryData);
    console.log(`✅ Created category: ${response.data.name}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === 'A category with this name or slug already exists') {
      console.log(`Category ${categoryData.name} already exists, retrieving...`);
      // Try to fetch all categories and find the one we want
      const categoriesResponse = await axios.get(`${API_BASE_URL}/sites/${siteSlug}/categories`);
      const slug = categoryData.slug || categoryData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingCategory = categoriesResponse.data.find(category => category.slug === slug);
      if (existingCategory) {
        console.log(`Retrieved existing category: ${existingCategory.name}`);
        return existingCategory;
      }
    }
    console.error(`❌ Error creating category:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a listing via the API
 */
async function createListing(siteSlug, listingData) {
  try {
    console.log(`Creating listing: ${listingData.title}...`);
    const response = await axios.post(`${API_BASE_URL}/sites/${siteSlug}/listings`, listingData);
    console.log(`✅ Created listing: ${response.data.title}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating listing:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main function to seed all data
 */
async function seedData() {
  console.log('🌱 Seeding sample data via API...');

  try {
    // Create fishing gear site
    const fishingSite = await createSite({
      name: 'Fishing Gear Reviews',
      slug: 'fishing-gear',
      domain: 'fishinggearreviews.com',
      primaryKeyword: 'fishing equipment reviews',
      metaDescription: 'Expert reviews of the best fishing gear and equipment for anglers of all levels',
      headerText: 'Expert Fishing Gear Reviews',
      defaultLinkAttributes: 'dofollow',
    });

    // Create fishing gear categories
    const categories = [
      {
        name: 'Rods',
        slug: 'rods',
        metaDescription: 'Find the best fishing rods for every type of fishing',
      },
      {
        name: 'Reels',
        slug: 'reels',
        metaDescription: 'Explore top-rated fishing reels for freshwater and saltwater fishing',
      },
      {
        name: 'Tackle',
        slug: 'tackle',
        metaDescription: 'Essential fishing tackle and accessories for your next fishing trip',
      },
    ];

    // Create each category and store the results
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = await createCategory(fishingSite.slug, categoryData);
      createdCategories.push(category);
    }

    // Create fishing gear listings
    const listings = [
      {
        title: 'Shimano Stradic FL Spinning Reel Review',
        categoryId: createdCategories[1].id, // Reels category
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
      },
      {
        title: 'St. Croix Legend X Casting Rod Review',
        categoryId: createdCategories[0].id, // Rods category
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
      },
    ];

    // Create each listing
    for (const listingData of listings) {
      await createListing(fishingSite.slug, listingData);
    }

    // Create haunted items site
    const hauntedSite = await createSite({
      name: 'Haunted Items Registry',
      slug: 'haunted-items',
      domain: 'haunteditems.com',
      primaryKeyword: 'haunted objects registry',
      metaDescription: 'Repository of reportedly haunted artifacts, collectibles, and objects with supernatural activity',
      headerText: 'Haunted Items Registry & Documentation',
      defaultLinkAttributes: 'dofollow',
    });

    // Create haunted items categories
    const hauntedCategories = [
      {
        name: 'Haunted Dolls',
        slug: 'haunted-dolls',
        metaDescription: 'Collection of reportedly haunted dolls and figures with documented paranormal activity',
      },
      {
        name: 'Cursed Objects',
        slug: 'cursed-objects',
        metaDescription: 'Items with reported curses, hexes, or supernatural influences',
      },
      {
        name: 'Paranormal Furniture',
        slug: 'paranormal-furniture',
        metaDescription: 'Furniture pieces with histories of unexplained phenomena and ghostly activity',
      }
    ];

    // Create each haunted category and store the results
    const createdHauntedCategories = [];
    for (const categoryData of hauntedCategories) {
      const category = await createCategory(hauntedSite.slug, categoryData);
      createdHauntedCategories.push(category);
    }

    // Create haunted item listings
    const hauntedListings = [
      {
        title: 'Annabelle Replica: Documented Paranormal Activity',
        categoryId: createdHauntedCategories[0].id, // Haunted Dolls category
        metaDescription: 'Authentic replica of the infamous Annabelle doll with reportedly strange occurrences',
        content: 'This replica of the Annabelle doll has been associated with unexplained events in its owner\'s home...',
        imageUrl: 'https://example.com/images/annabelle-doll.jpg',
        backlinkUrl: 'https://paranormalcollectibles.com/annabelle',
        backlinkAnchorText: 'Annabelle Doll Replica',
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: {
          item_name: 'Annabelle Doll Replica',
          origin: 'Based on famous case study',
          activity_level: 'Moderate',
          verified: 'Yes',
        },
      },
      {
        title: 'Antique Rocking Chair with Paranormal Activity',
        categoryId: createdHauntedCategories[2].id, // Paranormal Furniture
        metaDescription: 'Victorian-era rocking chair that reportedly rocks on its own and shows unexplained activity',
        content: 'This 1940s rocking chair has been witnessed moving on its own by multiple observers...',
        imageUrl: 'https://example.com/images/haunted-chair.jpg',
        backlinkUrl: 'https://paranormalcollectibles.com/victorian-chair',
        backlinkAnchorText: 'Victorian Haunted Rocking Chair',
        backlinkPosition: 'body',
        backlinkType: 'dofollow',
        customFields: {
          item_name: 'Victorian Rocking Chair',
          origin: '1940s Estate Sale, New England',
          activity_level: 'High',
          verified: 'Multiple witness testimony',
        },
      },
      {
        title: 'Antique Dybbuk Box with Locket',
        categoryId: createdHauntedCategories[1].id, // Cursed Objects
        metaDescription: 'Authentic dybbuk box with documented strange occurrences and supposedly cursed locket',
        content: 'This dybbuk box from 2015 has been associated with unexplained noises and strange smells...',
        imageUrl: 'https://example.com/images/dybbuk-box.jpg',
        backlinkUrl: 'https://paranormalcollectibles.com/dybbuk-box',
        backlinkAnchorText: 'Authentic Dybbuk Box',
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: {
          item_name: 'Dybbuk Box with Locket',
          origin: 'Eastern European',
          activity_level: 'Moderate',
          verified: 'Owner reports',
        },
      },
    ];

    // Create each haunted listing
    for (const listingData of hauntedListings) {
      await createListing(hauntedSite.slug, listingData);
    }

    console.log('✅ All sample data has been successfully seeded via API');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Execute seeding function
seedData();