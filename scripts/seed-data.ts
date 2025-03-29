// API-based seeding script (TypeScript version)
import axios from 'axios';
import { SiteConfig, Category, Listing } from '../src/types';

// Base URL for API requests (can be configured for dev/prod environments)
// Always use port 3000 for Docker environment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Create a site via the API
 */
async function createSite(siteData: Partial<SiteConfig>): Promise<SiteConfig> {
  try {
    console.log(`Creating site: ${siteData.name}...`);
    const response = await axios.post<SiteConfig>(`${API_BASE_URL}/sites`, siteData);
    console.log(`✅ Created site: ${response.data.name} (${response.data.slug})`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error === 'Site slug already exists') {
      console.log(`Site ${siteData.slug} already exists, retrieving...`);
      // Try to fetch the existing site
      const sitesResponse = await axios.get<SiteConfig[]>(`${API_BASE_URL}/sites`);
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
async function createCategory(siteSlug: string, categoryData: Partial<Category>): Promise<Category> {
  try {
    console.log(`Creating category: ${categoryData.name}...`);
    const response = await axios.post<Category>(`${API_BASE_URL}/sites/${siteSlug}/categories`, categoryData);
    console.log(`✅ Created category: ${response.data.name}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error === 'A category with this name or slug already exists') {
      console.log(`Category ${categoryData.name} already exists, retrieving...`);
      // Try to fetch all categories and find the one we want
      const categoriesResponse = await axios.get<Category[]>(`${API_BASE_URL}/sites/${siteSlug}/categories`);
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
async function createListing(siteSlug: string, listingData: Partial<Listing>): Promise<Listing> {
  try {
    console.log(`Creating listing: ${listingData.title}...`);
    const response = await axios.post<Listing>(`${API_BASE_URL}/sites/${siteSlug}/listings`, listingData);
    console.log(`✅ Created listing: ${response.data.title}`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error creating listing:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main function to seed all data
 */
async function seedData(): Promise<void> {
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
    const createdCategories: Category[] = [];
    for (const categoryData of categories) {
      const category = await createCategory(fishingSite.slug, categoryData);
      createdCategories.push(category);
    }

    // Create fishing gear listings
    const listings: Partial<Listing>[] = [
      {
        title: 'Shimano Stradic FL Spinning Reel Review',
        categoryId: createdCategories[1].id, // Reels category
        metaDescription: 'In-depth review of the Shimano Stradic FL spinning reel with performance tests and durability analysis',
        content: 'The Shimano Stradic FL spinning reel offers exceptional performance for serious anglers...',
        imageUrl: 'https://example.com/images/shimano-stradic.jpg',
        backlinkUrl: 'https://fishingprostore.com/products/shimano-stradic',
        backlinkAnchorText: 'Shimano Stradic FL Spinning Reel',
        backlinkPosition: 'prominent' as 'prominent',
        backlinkType: 'dofollow' as 'dofollow',
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
        backlinkPosition: 'body' as 'body',
        backlinkType: 'dofollow' as 'dofollow',
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

    // Create hiking gear site
    const hikingSite = await createSite({
      name: 'Hiking Gear Directory',
      slug: 'hiking-gear',
      domain: 'hikinggearreviews.com',
      primaryKeyword: 'hiking gear reviews',
      metaDescription: 'Find the best hiking gear with our expert guides and reviews',
      headerText: 'Hiking Gear Reviews & Guides',
      defaultLinkAttributes: 'dofollow',
    });

    // Create hiking gear categories
    const hikingCategories = [
      {
        name: 'Backpacks',
        slug: 'backpacks',
        metaDescription: 'Find the perfect hiking backpack for your adventures',
      },
      {
        name: 'Footwear',
        slug: 'footwear',
        metaDescription: 'Hiking boots and shoes for all terrains and conditions',
      },
    ];

    // Create each hiking category and store the results
    const createdHikingCategories: Category[] = [];
    for (const categoryData of hikingCategories) {
      const category = await createCategory(hikingSite.slug, categoryData);
      createdHikingCategories.push(category);
    }

    // Create hiking gear listings
    const hikingListings: Partial<Listing>[] = [
      {
        title: 'Osprey Atmos AG 65 Backpack Review',
        categoryId: createdHikingCategories[0].id, // Backpacks category
        metaDescription: 'Comprehensive review of the Osprey Atmos AG 65 backpack for multi-day hiking trips',
        content: 'The Osprey Atmos AG 65 backpack combines comfort with ample storage for extended trips...',
        imageUrl: 'https://example.com/images/osprey-atmos.jpg',
        backlinkUrl: 'https://hikinggearstore.com/products/osprey-atmos',
        backlinkAnchorText: 'Osprey Atmos AG 65 Backpack',
        backlinkPosition: 'prominent' as 'prominent',
        backlinkType: 'dofollow' as 'dofollow',
        customFields: {
          product_name: 'Osprey Atmos AG 65 Backpack',
          brand: 'Osprey',
          rating: 4.7,
          product_type: 'backpack',
        },
      }
    ];

    // Create each hiking listing
    for (const listingData of hikingListings) {
      await createListing(hikingSite.slug, listingData);
    }

    console.log('✅ All sample data has been successfully seeded via API');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedData();
}

export {
  seedData,
  createSite,
  createCategory,
  createListing
};