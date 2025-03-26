// Test script to verify API endpoints
const fetch = require('node-fetch');

// In-memory store for test data
const memoryStore = new Map();

// Site data
const siteData = {
  name: 'Test Site',
  slug: 'test-site',
  domain: 'testsite.com',
  primaryKeyword: 'test keyword',
  metaDescription: 'Test description',
  headerText: 'Test header',
  defaultLinkAttributes: 'dofollow',
};

// Category data
const categoryData = {
  name: 'Test Category',
  slug: 'test-category',
  metaDescription: 'Test category description',
};

// Listing data
const listingData = {
  title: 'Test Listing',
  metaDescription: 'Test listing description',
  content: 'Test content for listing',
  backlinkUrl: 'https://example.com',
  backlinkAnchorText: 'Test Link',
  backlinkPosition: 'prominent',
  backlinkType: 'dofollow',
};

// Base URL for API
const API_BASE_URL = 'http://localhost:3001/api';

// Store created IDs
let createdSite;
let createdCategory;
let createdListing;

// Function to create a site
async function createSite() {
  console.log('Creating site...');
  const response = await fetch(`${API_BASE_URL}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create site: ${error}`);
  }

  const site = await response.json();
  console.log('Site created:', site);
  createdSite = site;
  return site;
}

// Function to create a category
async function createCategory() {
  console.log('Creating category...');
  const response = await fetch(`${API_BASE_URL}/sites/${createdSite.slug}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create category: ${error}`);
  }

  const category = await response.json();
  console.log('Category created:', category);
  createdCategory = category;
  return category;
}

// Function to create a listing
async function createListing() {
  console.log('Creating listing...');
  const listingWithCategory = {
    ...listingData,
    categoryId: createdCategory.id,
  };

  const response = await fetch(`${API_BASE_URL}/sites/${createdSite.slug}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listingWithCategory),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create listing: ${error}`);
  }

  const listing = await response.json();
  console.log('Listing created:', listing);
  createdListing = listing;
  return listing;
}

// Main test function
async function runTest() {
  try {
    // First check if the API is responding
    console.log('Testing API health check...');
    const healthCheck = await fetch(`${API_BASE_URL}/healthcheck`);
    
    if (!healthCheck.ok) {
      console.error('API health check failed:', await healthCheck.text());
      process.exit(1);
    }
    
    console.log('API health check OK');

    // Create test data
    await createSite();
    await createCategory();
    await createListing();

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();