/**
 * Simple script to test multitenancy hostname resolution
 */
// Use native fetch in Node.js (works in Node.js 18+)

async function testHostname(hostname, expectedSiteSlug) {
  try {
    console.log(`\n===== Testing ${hostname} =====`);
    const response = await fetch(`http://localhost:3000/api/site-info?hostname=${hostname}`);
    const data = await response.json();
    
    console.log(`Site from API: ${data.site?.name || 'None'} (${data.site?.slug || 'None'})`);
    console.log(`Expected site slug: ${expectedSiteSlug}`);
    
    if (data.site?.slug === expectedSiteSlug) {
      console.log('✅ PASS');
      return true;
    } else {
      console.log('❌ FAIL');
      console.log('Lookup details:', data.lookupInfo);
      return false;
    }
  } catch (error) {
    console.error(`Error testing ${hostname}:`, error);
    return false;
  }
}

async function main() {
  const testCases = [
    ['fishinggearreviews.com', 'fishing-gear'],
    ['hikinggearreviews.com', 'hiking-gear'],
    ['fishing-gear.mydirectory.com', 'fishing-gear'],
    ['hiking-gear.mydirectory.com', 'hiking-gear'],
    ['fishing-gear', 'fishing-gear'],
    ['hiking-gear', 'hiking-gear']
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [hostname, expectedSlug] of testCases) {
    const success = await testHostname(hostname, expectedSlug);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n===== Test Summary =====`);
  console.log(`${passed} passed, ${failed} failed`);
}

main().catch(console.error);