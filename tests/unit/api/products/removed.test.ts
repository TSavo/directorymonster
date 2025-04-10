/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

describe('Products API Removal', () => {
  it('should not have a products API route file', () => {
    const routePath = path.join(process.cwd(), 'src/app/api/products/route.ts');
    expect(fs.existsSync(routePath)).toBe(false);
  });

  it('should use the site-specific listings API instead', () => {
    // Try to import the products route (should fail)
    let productsRouteExists = true;
    try {
      require('@/app/api/products/route');
    } catch (error) {
      productsRouteExists = false;
    }
    expect(productsRouteExists).toBe(false);
    
    // Import the site-specific listings route (should succeed)
    let listingsRouteExists = false;
    try {
      const listingsRoute = require('@/app/api/sites/[siteSlug]/listings/route');
      listingsRouteExists = typeof listingsRoute.GET === 'function' && 
                           typeof listingsRoute.POST === 'function';
    } catch (error) {
      // Route doesn't exist or doesn't have the expected handlers
    }
    expect(listingsRouteExists).toBe(true);
  });
});
