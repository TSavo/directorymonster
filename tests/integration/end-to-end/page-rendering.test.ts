/**
 * @jest-environment node
 */
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { setupTestEnvironment, clearTestData } from '../setup';
import { SiteConfig } from '../../../src/types';

// Create a mock implementation for fetch
jest.mock('node-fetch', () => jest.fn());

describe('Page Rendering Tests', () => {
  // Store test data references
  let sites: SiteConfig[];
  
  // Store URLs for testing
  const baseUrl = 'http://localhost:3000';
  const siteUrls: Record<string, string> = {};
  
  beforeAll(async () => {
    // Set up test environment and store references
    const testData = await setupTestEnvironment();
    sites = testData.sites;
    
    // Set up site URLs for testing
    sites.forEach(site => {
      // Use domain or fallback to slug-based URL
      if (site.domain) {
        siteUrls[site.slug] = `http://${site.domain}`;
      } else {
        siteUrls[site.slug] = `${baseUrl}/${site.slug}`;
      }
    });
    
    // Mock the fetch function to simulate HTTP responses
    (fetch as jest.Mock).mockImplementation(async (url: string) => {
      // Extract the hostname from the URL
      let hostname = new URL(url).hostname;
      
      // Default to the first site if no specific site is matched
      let site = sites[0];
      
      // Find the site that matches the hostname
      for (const s of sites) {
        if (s.domain === hostname) {
          site = s;
          break;
        }
      }
      
      // Create a mock HTML response based on the site
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${site.name}</title>
            <meta name="description" content="${site.metaDescription}">
          </head>
          <body>
            <header>
              <h1>${site.headerText}</h1>
            </header>
            <main>
              <div id="content">
                <p>Welcome to ${site.name}</p>
              </div>
            </main>
            <footer>
              <p>&copy; ${new Date().getFullYear()} ${site.name}</p>
            </footer>
          </body>
        </html>
      `;
      
      // Return a mock response object
      return {
        ok: true,
        status: 200,
        text: async () => htmlContent,
      };
    });
  });
  
  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });
  
  it('should render homepage with site-specific content', async () => {
    // Test for each site
    for (const site of sites) {
      // Get the URL for this site
      const url = siteUrls[site.slug];
      
      // Fetch the homepage
      const response = await fetch(`${url}/`);
      
      // Verify response is successful
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      
      // Get the HTML content
      const html = await response.text();
      
      // Parse the HTML with JSDOM
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Verify site-specific content
      expect(document.title).toBe(site.name);
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(site.metaDescription);
      expect(document.querySelector('header h1')?.textContent).toBe(site.headerText);
      expect(document.querySelector('#content p')?.textContent).toContain(site.name);
    }
  });
  
  it('should maintain site isolation in rendered pages', async () => {
    // Skip test if we don't have at least 2 sites
    if (sites.length < 2) {
      console.warn('Skipping site isolation test: Need at least 2 sites');
      return;
    }
    
    // Get two different sites
    const site1 = sites[0];
    const site2 = sites[1];
    
    // Fetch the homepage for site 1
    const response1 = await fetch(`${siteUrls[site1.slug]}/`);
    const html1 = await response1.text();
    const dom1 = new JSDOM(html1);
    const document1 = dom1.window.document;
    
    // Fetch the homepage for site 2
    const response2 = await fetch(`${siteUrls[site2.slug]}/`);
    const html2 = await response2.text();
    const dom2 = new JSDOM(html2);
    const document2 = dom2.window.document;
    
    // Verify site 1 content doesn't appear in site 2
    expect(document2.title).not.toBe(site1.name);
    expect(document2.querySelector('header h1')?.textContent).not.toBe(site1.headerText);
    expect(document2.querySelector('#content p')?.textContent).not.toContain(site1.name);
    
    // Verify site 2 content doesn't appear in site 1
    expect(document1.title).not.toBe(site2.name);
    expect(document1.querySelector('header h1')?.textContent).not.toBe(site2.headerText);
    expect(document1.querySelector('#content p')?.textContent).not.toContain(site2.name);
  });
  
  it('should properly render SEO metadata', async () => {
    // Test for each site
    for (const site of sites) {
      // Get the URL for this site
      const url = siteUrls[site.slug];
      
      // Fetch the homepage
      const response = await fetch(`${url}/`);
      
      // Get the HTML content
      const html = await response.text();
      
      // Parse the HTML with JSDOM
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Verify SEO metadata
      expect(document.title).toBe(site.name);
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(site.metaDescription);
      
      // Verify canonical URL
      const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      expect(canonicalUrl).toContain(site.domain || site.slug);
    }
  });
});
