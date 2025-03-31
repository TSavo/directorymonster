/**
 * Next.js Mock Migration Assistant
 * 
 * This script helps identify test files using non-standard Next.js mocks
 * and suggests standardized replacements. It only provides suggestions
 * without modifying any files directly.
 * 
 * Usage:
 *   node scripts/migrate-nextjs-mocks.js [file-path]
 *   
 *   Options:
 *     file-path    Specific file to process (default: all files)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TEST_DIRS = [
  'tests',
  'tests/api',
  'tests/middleware',
  'tests/unit/middleware'
];

// Patterns to search for
const NON_STANDARD_PATTERNS = {
  // Non-standard Next.js request mocks
  nextRequestMock: /(?<!(createMockNextRequest|tests\/mocks\/next)).*(?:as NextRequest|as unknown as NextRequest)/g,
  
  // Non-standard Next.js response mocks
  nextResponseMock: /(?<!mockNextResponseJson).*NextResponse\.json.*(?!parseResponseBody)/g
};

// Function to get import statements needed
function getImportStatements(fileContent) {
  const imports = [];
  
  if (NON_STANDARD_PATTERNS.nextRequestMock.test(fileContent)) {
    if (!fileContent.includes("import { createMockNextRequest }")) {
      imports.push("import { createMockNextRequest } from '@/tests/mocks/next/request';");
    }
  }
  
  if (NON_STANDARD_PATTERNS.nextResponseMock.test(fileContent)) {
    if (!fileContent.includes("import { mockNextResponseJson }")) {
      imports.push("import { mockNextResponseJson } from '@/tests/mocks/next/response';");
    }
  }
  
  return imports;
}

// Function to suggest replacements for non-standard request mocks
function suggestRequestMockReplacements(fileContent) {
  const lines = fileContent.split('\n');
  const suggestions = [];
  
  let objectProps = null;
  let inObject = false;
  let objectStartLine = -1;
  let objectIndent = '';
  
  // First pass: Find and collect object properties for NextRequest mocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('{') && !line.includes('}') && !inObject &&
        (i + 1 < lines.length && lines[i + 1].includes(':') && 
         !lines[i + 1].includes(';'))) {
      inObject = true;
      objectProps = {};
      objectStartLine = i;
      objectIndent = line.match(/^\s*/)[0];
      
      // Extract variable name if available
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
      if (varMatch) {
        objectProps.varName = varMatch[1];
      }
      
      continue;
    }
    
    if (inObject) {
      // Check if this looks like a property line
      const propMatch = line.match(/\s*(\w+):\s*(.*?)(?:,|$)/);
      if (propMatch) {
        const [_, prop, value] = propMatch;
        objectProps[prop] = value.trim();
      }
      
      // Check if object definition ends
      if (line.includes('}') && line.includes('as') && 
          line.includes('NextRequest')) {
        inObject = false;
        
        // Suggest replacement
        const options = {};
        if (objectProps.headers) options.headers = objectProps.headers;
        if (objectProps.url) options.url = objectProps.url;
        if (objectProps.method) options.method = objectProps.method;
        if (objectProps.body) options.body = objectProps.body;
        
        const optionsStr = JSON.stringify(options, null, 2)
          .replace(/"([^"]+)":/g, '$1:')  // Remove quotes from property names
          .replace(/"/g, "'");            // Use single quotes for strings
        
        const replacement = `${objectIndent}const ${objectProps.varName || 'req'} = createMockNextRequest(${
          Object.keys(options).length > 0 
            ? optionsStr
            : ''
        });`;
        
        // Find the full range of lines to replace
        let endLine = i;
        
        suggestions.push({
          startLine: objectStartLine,
          endLine: endLine,
          original: lines.slice(objectStartLine, endLine + 1).join('\n'),
          replacement: replacement
        });
      }
    }
  }
  
  // Second pass: Find NextResponse.json usage and suggest mockNextResponseJson
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('NextResponse.json(') && !line.includes('mockNextResponseJson')) {
      const indent = line.match(/^\s*/)[0];
      const argsMatch = line.match(/NextResponse\.json\((.*)\)/);
      
      if (argsMatch) {
        const args = argsMatch[1].trim();
        let options = '';
        
        // Check if there's a status or headers option
        if (line.includes(', { status:') || line.includes(', {status:')) {
          const optionsMatch = line.match(/,\s*(\{.*\})\s*\)$/);
          if (optionsMatch) {
            options = `, ${optionsMatch[1]}`;
          }
        }
        
        const replacement = `${indent}mockNextResponseJson(${args}${options})`;
        
        suggestions.push({
          startLine: i,
          endLine: i,
          original: line,
          replacement: replacement
        });
      }
    }
  }
  
  return suggestions;
}

// Function to format import suggestions
function formatImportSuggestions(imports) {
  if (imports.length === 0) return 'No import changes needed';
  
  return 'Add the following imports:\n' + imports.join('\n');
}

// Function to format replacement suggestions
function formatReplacementSuggestions(suggestions) {
  if (suggestions.length === 0) return 'No replacements needed';
  
  let result = '';
  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    result += `\nReplacement #${i + 1}:\n`;
    result += `Lines ${suggestion.startLine + 1}-${suggestion.endLine + 1}:\n`;
    result += '```\n' + suggestion.original + '\n```\n';
    result += 'Replace with:\n';
    result += '```\n' + suggestion.replacement + '\n```\n';
  }
  
  return result;
}

// Function to process a file and display suggestions
function processFile(filePath) {
  console.log(`\nProcessing ${filePath}`);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  let fileHasNonStandardMocks = false;
  
  // Check for non-standard patterns
  for (const [patternName, pattern] of Object.entries(NON_STANDARD_PATTERNS)) {
    const matches = content.match(pattern);
    
    if (matches && matches.length > 0) {
      fileHasNonStandardMocks = true;
      console.log(`  Found ${matches.length} instances of ${patternName}`);
    }
  }
  
  if (!fileHasNonStandardMocks) {
    console.log('  ✓ File uses standard mocks');
    return;
  }
  
  // Get import statements needed
  const imports = getImportStatements(content);
  
  // Get suggestions
  const suggestions = suggestRequestMockReplacements(content);
  
  if (suggestions.length === 0) {
    console.log('  No automatic replacements available');
    return;
  }
  
  console.log(`  Found ${suggestions.length} replacements to make`);
  
  // Display suggestions
  console.log('\nSuggested changes for', filePath);
  console.log('='.repeat(50));
  console.log(formatImportSuggestions(imports));
  console.log('\nReplacement suggestions:');
  console.log(formatReplacementSuggestions(suggestions));
  console.log('='.repeat(50));
  
  return { filePath, imports, suggestions };
}

// Main function
function main() {
  console.log('Scanning for non-standard Next.js mocking patterns...');
  
  const args = process.argv.slice(2);
  const specificFile = args.find(arg => !arg.startsWith('--'));
  
  const results = [];
  
  if (specificFile) {
    // Process specific file
    if (fs.existsSync(specificFile)) {
      results.push(processFile(specificFile));
    } else {
      console.error(`Error: File not found - ${specificFile}`);
      process.exit(1);
    }
  } else {
    // Process all test files
    const projectRoot = path.resolve(__dirname, '..');
    
    // Find test files
    let processedFiles = 0;
    
    TEST_DIRS.forEach(dir => {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath, { withFileTypes: true })
          .filter(file => 
            file.isFile() && 
            (file.name.endsWith('.test.ts') || 
             file.name.endsWith('.test.tsx') || 
             file.name.endsWith('.test.js'))
          )
          .forEach(file => {
            const filePath = path.join(dirPath, file.name);
            const result = processFile(filePath);
            if (result) {
              results.push(result);
              processedFiles++;
            }
          });
      }
    });
    
    console.log(`\nScanned ${processedFiles} test files`);
  }
  
  // Summary
  console.log('\n=============== SUMMARY ===============');
  console.log(`Found ${results.length} files with non-standard Next.js mocks`);
  console.log('To apply these changes, manually update each file using the suggestions above');
}

// Run the main function
main();