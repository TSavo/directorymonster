/**
 * Redis Mock Analyzer
 * 
 * Specialized analyzer for Redis client mock patterns
 */

// Non-standard Redis mock patterns
const REDIS_PATTERNS = {
  // Direct jest.mock of redis client
  redisMock: /jest\.mock.*['"].*redis.*['"]/g,
  
  // Inline implementation of Redis functions
  redisImplementation: /redis:.*{.*get:.*jest\.fn/g,
};

// Standard import statements for Redis mocks
const REDIS_IMPORTS = {
  redisMock: "import { redis } from '@/tests/mocks/lib/redis-client';"
};

/**
 * Find redis mock patterns in file content
 * 
 * @param {string} content File content
 * @returns {object[]} Array of redis mock implementations with context
 */
function findRedisMocks(content) {
  const lines = content.split('\n');
  const mocks = [];
  
  let inJestMock = false;
  let mockStart = -1;
  let mockEnd = -1;
  let mockDepth = 0;
  
  // Scan for jest.mock patterns of Redis client
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for the start of a jest.mock for redis
    if (line.match(/jest\.mock.*['"].*redis.*['"]/)) {
      inJestMock = true;
      mockStart = i;
      mockDepth = 0;
      continue;
    }
    
    // If we're inside a jest.mock block, track nesting
    if (inJestMock) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      mockDepth += openBraces - closeBraces;
      
      // If we've found the end of the mock
      if (mockDepth <= 0 && line.includes('))') || line.includes('})')) {
        mockEnd = i;
        
        // Extract the mock implementation
        const mockImplementation = lines.slice(mockStart, mockEnd + 1).join('\n');
        
        mocks.push({
          type: 'jestMock',
          startLine: mockStart,
          endLine: mockEnd,
          implementation: mockImplementation
        });
        
        inJestMock = false;
      }
    }
  }
  
  return mocks;
}

/**
 * Analyze the Redis functions implemented in a mock
 * 
 * @param {string} mockImplementation Mock implementation code
 * @returns {object} Analysis of the Redis functions mocked
 */
function analyzeRedisFunctions(mockImplementation) {
  const functions = [];
  
  // Common Redis functions to look for
  const redisFunctions = [
    'get', 'set', 'del', 'keys', 'sadd', 'smembers', 'srem', 'hget', 'hset', 'ping'
  ];
  
  // Check for each function
  for (const func of redisFunctions) {
    const functionPattern = new RegExp(`${func}:\\s*jest\\.fn\\(\\)`, 'g');
    if (functionPattern.test(mockImplementation)) {
      functions.push(func);
    }
  }
  
  return {
    functions,
    implementationComplexity: mockImplementation.split('\n').length
  };
}

/**
 * Generate a standardized Redis mock import and setup
 * 
 * @param {object} mockDef Redis mock definition from findRedisMocks
 * @returns {string} Standardized mock code
 */
function generateStandardizedRedisMock(mockDef) {
  const functions = analyzeRedisFunctions(mockDef.implementation);
  
  // Check if we need mock data setup
  const needsSetup = functions.implementationComplexity > 5;
  
  let standardizedCode = '';
  
  if (needsSetup) {
    standardizedCode = `// Use standardized Redis mock
import { redis, setupRedisMock } from '@/tests/mocks/lib/redis-client';

// Setup initial mock data if needed
beforeEach(() => {
  setupRedisMock({
    initialData: {
      // Add your initial data here
    }
  });
});`;
  } else {
    standardizedCode = `// Use standardized Redis mock
import { redis } from '@/tests/mocks/lib/redis-client';

// Clear Redis mock between tests
beforeEach(() => {
  jest.clearAllMocks();
});`;
  }
  
  return standardizedCode;
}

/**
 * Analyze a file for Redis mock patterns
 * 
 * @param {string} filePath Path to the file to analyze
 * @returns {object} Analysis results
 */
function analyzeRedisMocks(filePath) {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find Redis mocks
  const redisMocks = findRedisMocks(content);
  
  // Analyze each mock
  const analyzedMocks = redisMocks.map(mock => ({
    ...mock,
    analysis: analyzeRedisFunctions(mock.implementation)
  }));
  
  return {
    filePath,
    content,
    redisMocks: analyzedMocks,
    needsStandardization: analyzedMocks.length > 0
  };
}

// Export the module
module.exports = {
  REDIS_PATTERNS,
  REDIS_IMPORTS,
  analyzeRedisMocks,
  findRedisMocks,
  generateStandardizedRedisMock
};