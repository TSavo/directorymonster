/**
 * Next.js Mock Analyzer
 * 
 * Specialized analyzer for Next.js mock patterns, including NextRequest
 * and NextResponse mocks.
 */

// Non-standard Next.js mock patterns
const NEXT_PATTERNS = {
  // Non-standard Next.js request mocks
  nextRequestMock: /(?<!(createMockNextRequest|tests\/mocks\/next)).*(?:as NextRequest|as unknown as NextRequest)/g,
  
  // Non-standard Next.js response mocks
  nextResponseMock: /(?<!mockNextResponseJson).*NextResponse\.json.*(?!parseResponseBody)/g
};

// Standard import statements for Next.js mocks
const NEXT_IMPORTS = {
  nextRequestMock: "import { createMockNextRequest } from '@/tests/mocks/next/request';",
  nextResponseMock: "import { mockNextResponseJson } from '@/tests/mocks/next/response';"
};

// Files to ignore (e.g., standard mock implementations)
const IGNORE_PATTERNS = [
  /tests\/mocks\/next\//,
  /tests\/mocks\/lib\//,
  /setup-next-test\.js/
];

/**
 * Analyze a JavaScript/TypeScript object definition
 * to extract properties and structure
 * 
 * @param {string[]} lines Lines of code to analyze
 * @param {number} startLine Line where object definition starts
 * @returns {object} Extracted object properties and metadata
 */
function analyzeObjectDefinition(lines, startLine) {
  const objectProps = {};
  let objectDepth = 0;
  let currentProp = null;
  let endLine = startLine;

  // Extract variable name if available
  const line = lines[startLine];
  const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
  if (varMatch) {
    objectProps.varName = varMatch[1];
  }
  
  // Extract indentation
  objectProps.indent = line.match(/^\s*/)[0];
  
  // Track if we're looking at NextRequest mock
  let isNextRequestMock = false;
  
  // Parse lines until we find the end of the object
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Count opening and closing braces to track nesting
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    objectDepth += openBraces - closeBraces;
    
    // Check for NextRequest casting
    if (line.includes('as NextRequest') || line.includes('as unknown as NextRequest')) {
      isNextRequestMock = true;
    }
    
    // Look for property assignments
    const propMatch = line.match(/(\w+):\s*(.*?)(?:,|$)/);
    if (propMatch && objectDepth > 0) {
      const [_, propName, propValue] = propMatch;
      objectProps[propName] = propValue.trim();
    }
    
    // If we've reached the end of the object and it's a NextRequest mock
    if (objectDepth === 0 && i > startLine && isNextRequestMock) {
      endLine = i;
      break;
    }
  }
  
  return {
    properties: objectProps,
    startLine,
    endLine,
    isNextRequestMock
  };
}

/**
 * Find NextRequest mock objects in file content
 * 
 * @param {string} content File content
 * @returns {object[]} Array of object definitions
 */
function findNextRequestMocks(content) {
  const lines = content.split('\n');
  const objects = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for object literals that might be NextRequest mocks
    if (line.includes('{') && !line.includes('}') && 
        (i + 1 < lines.length && lines[i + 1].match(/\s*\w+:/))) {
      const obj = analyzeObjectDefinition(lines, i);
      if (obj.isNextRequestMock) {
        objects.push(obj);
        // Skip to the end of this object
        i = obj.endLine;
      }
    }
  }
  
  return objects;
}

/**
 * Find NextResponse.json() calls that should use mockNextResponseJson
 * 
 * @param {string} content File content
 * @returns {object[]} Array of response mocks with line numbers
 */
function findNextResponseMocks(content) {
  const lines = content.split('\n');
  const mocks = [];
  
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
        
        mocks.push({
          line: i,
          indent,
          args,
          options,
          original: line
        });
      }
    }
  }
  
  return mocks;
}

/**
 * Analyze a file for Next.js mock patterns
 * 
 * @param {string} filePath Path to the file to analyze
 * @returns {object} Analysis results
 */
function analyzeNextJsMocks(filePath) {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find Next.js request mocks
  const requestMocks = findNextRequestMocks(content);
  
  // Find Next.js response mocks
  const responseMocks = findNextResponseMocks(content);
  
  return {
    filePath,
    content,
    requestMocks,
    responseMocks,
    needsStandardization: requestMocks.length > 0 || responseMocks.length > 0
  };
}

/**
 * Generate a standardized NextRequest mock
 * 
 * @param {object} mockDef Object definition from analyzeObjectDefinition
 * @returns {string} Standardized mock code
 */
function generateStandardizedRequestMock(mockDef) {
  const { properties } = mockDef;
  const options = {};
  
  // Map properties to createMockNextRequest options
  if (properties.headers) options.headers = properties.headers;
  if (properties.url) options.url = properties.url;
  if (properties.method) options.method = properties.method;
  if (properties.body) options.body = properties.body;
  
  // Format options object for code generation
  let optionsStr = '';
  if (Object.keys(options).length > 0) {
    optionsStr = JSON.stringify(options, null, 2)
      .replace(/"([^"]+)":/g, '$1:')  // Remove quotes from property names
      .replace(/"/g, "'")             // Use single quotes for strings
      .replace(/\n/g, `\n${properties.indent}  `); // Proper indentation
  }
  
  // Generate the standardized mock
  return `${properties.indent}const ${properties.varName || 'req'} = createMockNextRequest(${
    Object.keys(options).length > 0 
      ? optionsStr
      : ''
  });`;
}

/**
 * Generate a standardized NextResponse.json mock
 * 
 * @param {object} mockDef Response mock definition
 * @returns {string} Standardized mock code
 */
function generateStandardizedResponseMock(mockDef) {
  const { indent, args, options } = mockDef;
  return `${indent}mockNextResponseJson(${args}${options})`;
}

// Export the module
module.exports = {
  NEXT_PATTERNS,
  NEXT_IMPORTS,
  IGNORE_PATTERNS,
  analyzeNextJsMocks,
  findNextRequestMocks,
  findNextResponseMocks,
  generateStandardizedRequestMock,
  generateStandardizedResponseMock
};