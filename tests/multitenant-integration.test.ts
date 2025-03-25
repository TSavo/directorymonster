/**
 * Integration tests for multitenancy features
 * 
 * These tests verify that the site is correctly identified based on hostname.
 * They can be run manually and automatically.
 */

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