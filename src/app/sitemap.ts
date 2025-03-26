import { MetadataRoute } from 'next';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Listing, Category } from '@/types';
import { generateSiteBaseUrl, generateCategoryUrl, generateListingUrl } from '@/lib/site-utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  
  // Get all sites
  const siteKeys = await kv.keys('site:slug:*');
  const sites: SiteConfig[] = await Promise.all(
    siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
  );
  
  for (const site of sites) {
    const baseUrl = generateSiteBaseUrl(site);
    
    // Add site homepage
    entries.push({
      url: baseUrl,
      lastModified: new Date(site.updatedAt),
      changeFrequency: 'daily',
      priority: 1.0,
    });
    
    // Get site categories
    const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
    const categories: Category[] = await Promise.all(
      categoryKeys.map(async (key) => await kv.get<Category>(key))
    );
    
    // Add category pages
    for (const category of categories) {
      entries.push({
        url: generateCategoryUrl(site, category.slug),
        lastModified: new Date(category.updatedAt),
        changeFrequency: 'daily',
        priority: 0.8,
      });
      
      // Get category listings
      const listingKeys = await kv.keys(`listing:category:${category.id}:*`);
      const listings: Listing[] = await Promise.all(
        listingKeys.map(async (key) => await kv.get<Listing>(key))
      );
      
      // Add listing pages
      for (const listing of listings) {
        entries.push({
          url: generateListingUrl(site, category.slug, listing.slug),
          lastModified: new Date(listing.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  }
  
  return entries;
}