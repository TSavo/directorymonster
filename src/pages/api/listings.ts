// Simple API endpoint for the extractor.py script
import { redis } from '../../lib/redis-client';
import { NextApiRequest, NextApiResponse } from 'next';
import { Listing, SiteConfig, Category } from '@/types';

interface ListingsResponse {
  listings: Listing[];
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface ListingCreateRequest {
  siteSlug: string;
  categoryId: string;
  title: string;
  metaDescription?: string;
  content?: string;
  imageUrl?: string;
  backlinkUrl?: string;
  backlinkAnchorText?: string;
  customFields?: Record<string, any>;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<Listing | ListingsResponse | ErrorResponse>
) {
  console.log(`API: ${req.method} /api/listings - Received request`);
  
  // Basic API key authentication
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== 'dev-api-key') {
    console.log(`API: ${req.method} /api/listings - Invalid API key`);
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { method } = req;

  try {
    if (method === 'GET') {
      // Get all listings
      console.log(`API: GET /api/listings - Fetching listings from Redis`);
      const keys = await redis.keys('listing:id:*');
      const listings: Listing[] = [];
      
      for (const key of keys) {
        const listingData = await redis.get(key);
        if (listingData) {
          const listing = JSON.parse(listingData) as Listing;
          listings.push(listing);
        }
      }
      
      console.log(`API: GET /api/listings - Found ${listings.length} listings`);
      return res.status(200).json({ listings });
    } else if (method === 'POST') {
      // Create a new listing
      console.log(`API: POST /api/listings - Processing request`);
      
      const { 
        siteSlug, 
        categoryId, 
        title, 
        metaDescription, 
        content, 
        imageUrl, 
        backlinkUrl, 
        backlinkAnchorText,
        customFields
      } = req.body as ListingCreateRequest;
      
      if (!siteSlug || !categoryId || !title) {
        console.log(`API: POST /api/listings - Missing required fields`);
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Get site by slug
      console.log(`API: POST /api/listings - Looking up site: ${siteSlug}`);
      const siteKey = `site:slug:${siteSlug}`;
      const siteData = await redis.get(siteKey);
      
      if (!siteData) {
        console.log(`API: POST /api/listings - Site not found: ${siteSlug}`);
        return res.status(404).json({ error: 'Site not found' });
      }
      
      const site = JSON.parse(siteData) as SiteConfig;
      console.log(`API: POST /api/listings - Found site: ${site.id}`);
      
      // Get category by ID
      console.log(`API: POST /api/listings - Looking up category: ${categoryId}`);
      const categoryKey = `category:id:${categoryId}`;
      const categoryData = await redis.get(categoryKey);
      
      if (!categoryData) {
        console.log(`API: POST /api/listings - Category not found: ${categoryId}`);
        return res.status(404).json({ error: 'Category not found' });
      }
      console.log(`API: POST /api/listings - Found category: ${categoryId}`);
      
      // Create listing
      const timestamp = Date.now();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const listing: Listing = {
        id: `listing_${timestamp}`,
        siteId: site.id,
        categoryId,
        title,
        slug,
        metaDescription: metaDescription || title,
        content: content || title,
        imageUrl: imageUrl || '',
        backlinkUrl: backlinkUrl || '',
        backlinkAnchorText: backlinkAnchorText || title,
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: customFields || {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      
      // Store listing in Redis
      console.log(`API: POST /api/listings - Storing listing: ${listing.id}`);
      await redis.set(`listing:id:${listing.id}`, JSON.stringify(listing));
      await redis.set(`listing:site:${site.id}:${listing.slug}`, JSON.stringify(listing));
      await redis.set(`listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
      
      console.log(`API: POST /api/listings - Successfully created listing: ${listing.id}`);
      return res.status(201).json(listing);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}