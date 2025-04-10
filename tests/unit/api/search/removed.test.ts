/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

describe('Search API Removal', () => {
  it('should not have a global search API route file', () => {
    const routePath = path.join(process.cwd(), 'src/app/api/search/route.ts');
    expect(fs.existsSync(routePath)).toBe(false);
  });

  it('should use the site-specific search API instead', () => {
    // Try to import the global search route (should fail)
    let searchRouteExists = true;
    try {
      require('@/app/api/search/route');
    } catch (error) {
      searchRouteExists = false;
    }
    expect(searchRouteExists).toBe(false);
    
    // Import the site-specific search route (should succeed)
    let siteSearchRouteExists = false;
    try {
      const siteSearchRoute = require('@/app/api/sites/[siteSlug]/search/route');
      siteSearchRouteExists = typeof siteSearchRoute.GET === 'function';
    } catch (error) {
      // Route doesn't exist or doesn't have the expected handlers
    }
    expect(siteSearchRouteExists).toBe(true);
  });
});
