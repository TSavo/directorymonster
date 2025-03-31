/**
 * Scan for non-standardized mocking patterns in test files
 * 
 * This script identifies test files that use non-standardized mocking patterns
 * for Next.js components, Redis clients, and security middleware.
 * 
 * Usage:
 *   node scripts/scan-mocking-patterns.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TEST_DIRS = [
  'tests',
  'tests/api',
  'tests/middleware',
  'tests/redis',
  'tests/components',
  'tests/integration'
];

// Patterns to search for
const NON_STANDARD_PATTERNS = {
  // Non-standard Next.js mocks
  nextRequestMock: /(?<!(createMockNextRequest|tests\/mocks\/next)).*(?:as NextRequest|as unknown as NextRequest)/g,
  nextResponseMock: /(?<!mockNextResponseJson).*NextResponse\.json.*(?!parseResponseBody)/g,
  
  // Non-standard Redis mocks
  redisMock: /jest\.mock.*['"].*redis.*['"]/g,
  redisImplementation: /redis:.*{.*get:.*jest\.fn/g,
  
  // Non-standard security middleware mocks
  securityMiddlewareMock: /jest\.mock.*['"].*middleware\/secureTenantContext.*['"]/g,
  tenantContextMock: /(?<!MockTenantContext).*TenantContext.*fromRequest/g,
  
  // Non-standard JWT mocks
  jwtMock: /jest\.mock.*['"]jsonwebtoken['"]|verify:.*jest\.fn/g,
  
  // Other common mocks
  roleMock: /jest\.mock.*['"].*role-service.*['"]/g
};

// Ignore patterns - false positives
const IGNORE_PATTERNS = [
  /tests\/mocks\/next\//,
  /tests\/mocks\/lib\//,
  /setup-next-test\.js/
];

// Track results
const results = {
  scannedFiles: 0,
  filesWithNonStandardMocks: [],
  patternOccurrences: {},
  summary: {}
};

// Initialize pattern occurrences
Object.keys(NON_STANDARD_PATTERNS).forEach(key => {
  results.patternOccurrences[key] = [];
  results.summary[key] = 0;
});

/**
 * Scan a file for non-standard mocking patterns
 */
function scanFile(filePath) {
  // Skip files that match ignore patterns
  if (IGNORE_PATTERNS.some(pattern => pattern.test(filePath))) {
    return;
  }
  
  results.scannedFiles++;
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  let fileHasNonStandardMocks = false;
  
  // Check each pattern
  for (const [patternName, pattern] of Object.entries(NON_STANDARD_PATTERNS)) {
    const matches = content.match(pattern);
    
    if (matches && matches.length > 0) {
      fileHasNonStandardMocks = true;
      results.patternOccurrences[patternName].push({
        file: filePath,
        count: matches.length,
        lines: findMatchingLines(content, pattern)
      });
      results.summary[patternName] += matches.length;
    }
  }
  
  if (fileHasNonStandardMocks) {
    results.filesWithNonStandardMocks.push(filePath);
  }
}

/**
 * Find line numbers for pattern matches
 */
function findMatchingLines(content, pattern) {
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
  
  return matchingLines;
}

/**
 * Scan directories recursively
 */
function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && 
              (entry.name.endsWith('.test.ts') || 
               entry.name.endsWith('.test.tsx') || 
               entry.name.endsWith('.test.js'))) {
      scanFile(fullPath);
    }
  }
}

/**
 * Generate HTML report
 */
function generateHTMLReport() {
  const reportPath = path.join(__dirname, '../mock-patterns-report.html');
  
  // Generate file content by pattern statistics
  const patternStats = Object.entries(results.patternOccurrences)
    .map(([pattern, occurrences]) => {
      if (occurrences.length === 0) return '';
      
      const fileList = occurrences.map(occurrence => {
        const lines = occurrence.lines.map(line => 
          `<div class="line"><span class="line-number">${line.lineNumber}</span> <code>${escapeHTML(line.content)}</code></div>`
        ).join('');
        
        return `
          <div class="file">
            <h4>${occurrence.file} (${occurrence.count} occurrences)</h4>
            <div class="lines">${lines}</div>
          </div>
        `;
      }).join('');
      
      return `
        <div class="pattern">
          <h3>${pattern} (${results.summary[pattern]} total occurrences)</h3>
          <div class="files">${fileList}</div>
        </div>
      `;
    })
    .filter(content => content !== '')
    .join('');
  
  // HTML template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Patterns Analysis</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.5; }
        h1, h2, h3 { color: #333; }
        .summary { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
        .pattern { margin-bottom: 30px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .file { margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 3px; }
        .lines { margin-left: 20px; }
        .line { display: flex; margin: 5px 0; font-family: monospace; }
        .line-number { min-width: 40px; color: #666; }
        code { white-space: pre-wrap; }
        .timestamp { font-style: italic; color: #666; }
      </style>
    </head>
    <body>
      <h1>Non-Standard Mock Patterns Analysis</h1>
      <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <p>Scanned ${results.scannedFiles} files, found ${results.filesWithNonStandardMocks.length} files with non-standard mocking patterns.</p>
        <ul>
          ${Object.entries(results.summary)
            .filter(([_, count]) => count > 0)
            .map(([pattern, count]) => `<li>${pattern}: ${count} occurrences</li>`)
            .join('')}
        </ul>
      </div>
      
      <h2>Detailed Results</h2>
      ${patternStats}
    </body>
    </html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`Report generated at: ${reportPath}`);
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main function
 */
function main() {
  console.log('Scanning for non-standard mocking patterns...');
  
  // Get project root
  const projectRoot = path.resolve(__dirname, '..');
  
  // Scan test directories
  TEST_DIRS.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath);
    }
  });
  
  // Generate report
  generateHTMLReport();
  
  // Print summary to console
  console.log('\nSummary:');
  console.log(`Scanned ${results.scannedFiles} files`);
  console.log(`Found ${results.filesWithNonStandardMocks.length} files with non-standard mocking patterns`);
  
  for (const [pattern, count] of Object.entries(results.summary)) {
    if (count > 0) {
      console.log(`${pattern}: ${count} occurrences`);
    }
  }
  
  // Provide recommendation
  if (results.filesWithNonStandardMocks.length > 0) {
    console.log('\nRecommendation: Review the HTML report for details on non-standard mocking patterns');
    console.log('Consider refactoring these files to use the standardized mocks from tests/mocks/next and tests/mocks/lib');
  } else {
    console.log('\nGreat! All test files are using standardized mocking patterns.');
  }
}

// Run the main function
main();
