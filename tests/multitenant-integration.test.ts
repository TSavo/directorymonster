/**
 * Integration tests for multitenancy features
 * 
 * These tests verify that the site is correctly identified based on hostname.
 * They can be run manually and automatically.
 */

import fetch from 'node-fetch';

// Basic test function to check hostname resolution
export async function testHostnameResolution(hostname: string, expectedSiteSlug: string): Promise<boolean> {
  try {
    // For testing within a browser or NodeJS, adjust URL as needed
    // When testing from inside a container, use port 3000
    const response = await fetch(`http://localhost:3000/api/site-info?hostname=${hostname}`);
    const data = await response.json();
    
    // Log detailed results
    console.log(`\n----- Test: ${hostname} should resolve to ${expectedSiteSlug} -----`);
    console.log(`Site from API: ${data.site?.name} (${data.site?.slug})`);
    console.log(`Expected site slug: ${expectedSiteSlug}`);
    
    // Check if the site was correctly identified
    const success = data.site?.slug === expectedSiteSlug;
    console.log(`Test ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // If failed, show more debug info
    if (!success) {
      console.log('Detailed API response:', JSON.stringify(data, null, 2));
    }
    
    return success;
  } catch (error) {
    console.error(`Error testing ${hostname}:`, error);
    return false;
  }
}

// Main test function
export async function runMultitenancyTests() {
  const results = [];
  
  // Test domains
  results.push(await testHostnameResolution('fishinggearreviews.com', 'fishing-gear'));
  results.push(await testHostnameResolution('hikinggearreviews.com', 'hiking-gear'));
  
  // Test subdomains
  results.push(await testHostnameResolution('fishing-gear.mydirectory.com', 'fishing-gear'));
  results.push(await testHostnameResolution('hiking-gear.mydirectory.com', 'hiking-gear'));
  
  // Test direct slugs
  results.push(await testHostnameResolution('fishing-gear', 'fishing-gear'));
  results.push(await testHostnameResolution('hiking-gear', 'hiking-gear'));
  
  // Summary
  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;
  
  console.log('===================================');
  console.log(`Multitenancy tests: ${passed} passed, ${failed} failed`);
  console.log('===================================');
  
  return {
    passed,
    failed,
    success: failed === 0
  };
}

// For browser execution
if (typeof window !== 'undefined') {
  (window as any).runMultitenancyTests = runMultitenancyTests;
}

// For direct NodeJS execution
if (typeof require !== 'undefined' && require.main === module) {
  runMultitenancyTests().then(results => {
    console.log('Tests completed with result:', results);
    process.exit(results.success ? 0 : 1);
  });
}

// Add Jest test cases
describe('Multitenancy Integration Tests', () => {
  beforeAll(() => {
    // This ensures that the test doesn't time out too quickly
    jest.setTimeout(30000);
  });

  test('Domain and subdomain resolution tests', async () => {
    // Mock the fetch response for testing
    const mockResponse = {
      site: {
        name: 'Fishing Gear Reviews',
        slug: 'fishing-gear'
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const result = await testHostnameResolution('fishinggearreviews.com', 'fishing-gear');
    expect(result).toBe(true);
  });

  test('Multiple hostnames should resolve to correct sites', async () => {
    // Create a mock implementation that returns different responses based on hostname
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const urlObj = new URL(url);
      const hostname = urlObj.searchParams.get('hostname');
      
      let mockSite;
      
      if (hostname?.includes('fishing')) {
        mockSite = { name: 'Fishing Gear Reviews', slug: 'fishing-gear' };
      } else if (hostname?.includes('hiking')) {
        mockSite = { name: 'Hiking Gear Reviews', slug: 'hiking-gear' };
      } else {
        mockSite = { name: 'Default Site', slug: 'default' };
      }
      
      return Promise.resolve({
        json: () => Promise.resolve({ site: mockSite })
      });
    });

    // Test multiple hostnames
    const fishingResult = await testHostnameResolution('fishinggearreviews.com', 'fishing-gear');
    const hikingResult = await testHostnameResolution('hikinggearreviews.com', 'hiking-gear');
    const fishingSubdomainResult = await testHostnameResolution('fishing-gear.mydirectory.com', 'fishing-gear');
    
    expect(fishingResult).toBe(true);
    expect(hikingResult).toBe(true);
    expect(fishingSubdomainResult).toBe(true);
  });
});