/**
 * Analyze Mock Patterns
 * 
 * A simplified script to analyze non-standard mock patterns
 * without applying any migrations.
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for
const PATTERNS = {
  // Next.js mocks
  nextRequestMock: /(?<!(createMockNextRequest|tests\/mocks\/next)).*(?:as NextRequest|as unknown as NextRequest)/g,
  nextResponseMock: /(?<!mockNextResponseJson).*NextResponse\.json.*(?!parseResponseBody)/g,
  
  // Redis mocks
  redisMock: /jest\.mock.*['"].*redis.*['"]/g,
  redisImplementation: /redis:.*{.*get:.*jest\.fn/g,
  
  // Security middleware mocks
  securityMiddlewareMock: /jest\.mock.*['"].*middleware\/secureTenantContext.*['"]/g,
  tenantContextMock: /(?<!MockTenantContext).*TenantContext.*fromRequest/g,
  
  // JWT mocks
  jwtMock: /jest\.mock.*['"]jsonwebtoken['"]|verify:.*jest\.fn/g
};

// Ignore patterns
const IGNORE_PATTERNS = [
  /tests\/mocks\/next\//,
  /tests\/mocks\/lib\//,
  /setup-next-test\.js/
];

/**
 * Scan a file for patterns
 */
function scanFile(filePath) {
  // Skip files that match ignore patterns
  if (IGNORE_PATTERNS.some(pattern => pattern.test(filePath))) {
    return null;
  }
  
  console.log(`\nAnalyzing ${filePath}`);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  let fileHasPatterns = false;
  const matches = {};
  
  // Check each pattern
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    const patternMatches = content.match(pattern);
    
    if (patternMatches && patternMatches.length > 0) {
      fileHasPatterns = true;
      console.log(`  Found ${patternMatches.length} instances of ${patternName}`);
      
      // Find line numbers for reference
      const lines = content.split('\n');
      const matchingLines = [];
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          matchingLines.push({
            lineNumber: index + 1,
            content: line.trim()
          });
        }
      });
      
      matches[patternName] = {
        count: patternMatches.length,
        lines: matchingLines
      };
    }
  }
  
  if (!fileHasPatterns) {
    console.log('  ✓ File uses standard mocks');
    return null;
  }
  
  return {
    filePath,
    matches
  };
}

/**
 * Main function
 */
function main() {
  // Get file path from command line
  const args = process.argv.slice(2);
  const filePath = args[0];
  
  if (!filePath) {
    console.error('Please provide a file path to analyze');
    console.log('Usage: node analyze-mocks.js <file-path>');
    process.exit(1);
  }
  
  // Resolve the file path
  const resolvedPath = path.resolve(filePath);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }
  
  // Scan the file
  const result = scanFile(resolvedPath);
  
  if (result) {
    console.log('\nDetailed matches:');
    for (const [patternName, patternMatches] of Object.entries(result.matches)) {
      console.log(`\n  ${patternName} (${patternMatches.count} matches):`);
      patternMatches.lines.forEach(line => {
        console.log(`    Line ${line.lineNumber}: ${line.content}`);
      });
    }
    
    console.log('\nThis file contains non-standard mock patterns that should be migrated');
    console.log('to use the standardized mock implementations from:');
    console.log('  - @/tests/mocks/next/request');
    console.log('  - @/tests/mocks/next/response');
    console.log('  - @/tests/mocks/lib/redis-client');
  } else {
    console.log('\nNo non-standard mock patterns found in this file.');
  }
}

// Run the main function
main();
