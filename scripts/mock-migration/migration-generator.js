/**
 * Migration Suggestion Generator
 * 
 * Generates suggestions for migrating from non-standard mocks to standardized mocks,
 * including code replacements and import statements.
 */

const fs = require('fs');
const path = require('path');
const nextAnalyzer = require('./nextjs-analyzer');
const redisAnalyzer = require('./redis-analyzer');
const coreScanner = require('./core-scanner');

/**
 * A suggestion for replacing non-standard code with standardized code
 * @typedef {Object} CodeSuggestion
 * @property {number} startLine - Starting line number (0-indexed)
 * @property {number} endLine - Ending line number (0-indexed)
 * @property {string} original - Original code
 * @property {string} replacement - Suggested replacement code
 */

/**
 * Generate migration suggestions for a file
 * 
 * @param {string} filePath Path to the file to analyze
 * @returns {object} Migration suggestions
 */
function generateMigrationSuggestions(filePath) {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  const suggestions = [];
  const imports = [];
  
  // Check for Next.js mocks
  const nextJsAnalysis = nextAnalyzer.analyzeNextJsMocks(filePath);
  if (nextJsAnalysis.needsStandardization) {
    // Add import suggestions
    if (nextJsAnalysis.requestMocks.length > 0) {
      imports.push(nextAnalyzer.NEXT_IMPORTS.nextRequestMock);
    }
    if (nextJsAnalysis.responseMocks.length > 0) {
      imports.push(nextAnalyzer.NEXT_IMPORTS.nextResponseMock);
    }
    
    // Add Next.js request mock suggestions
    for (const requestMock of nextJsAnalysis.requestMocks) {
      const replacement = nextAnalyzer.generateStandardizedRequestMock(requestMock);
      
      suggestions.push({
        startLine: requestMock.startLine,
        endLine: requestMock.endLine,
        original: content.split('\n').slice(requestMock.startLine, requestMock.endLine + 1).join('\n'),
        replacement
      });
    }
    
    // Add Next.js response mock suggestions
    for (const responseMock of nextJsAnalysis.responseMocks) {
      const replacement = nextAnalyzer.generateStandardizedResponseMock(responseMock);
      
      suggestions.push({
        startLine: responseMock.line,
        endLine: responseMock.line,
        original: responseMock.original,
        replacement
      });
    }
  }
  
  // Check for Redis mocks
  const redisAnalysis = redisAnalyzer.analyzeRedisMocks(filePath);
  if (redisAnalysis.needsStandardization) {
    // Add Redis mock suggestions
    for (const redisMock of redisAnalysis.redisMocks) {
      const replacement = redisAnalyzer.generateStandardizedRedisMock(redisMock);
      
      suggestions.push({
        startLine: redisMock.startLine,
        endLine: redisMock.endLine,
        original: content.split('\n').slice(redisMock.startLine, redisMock.endLine + 1).join('\n'),
        replacement
      });
      
      // Add import suggestion
      imports.push(redisAnalyzer.REDIS_IMPORTS.redisMock);
    }
  }
  
  // Remove duplicate imports
  const uniqueImports = [...new Set(imports)];
  
  return {
    filePath,
    imports: uniqueImports,
    suggestions,
    hasSuggestions: suggestions.length > 0
  };
}

/**
 * Apply migration suggestions to a file (creates a backup first)
 * 
 * @param {string} filePath Path to the file to modify
 * @param {object} migrationSuggestions Suggestions from generateMigrationSuggestions
 * @returns {object} Result of the operation
 */
function applyMigrationSuggestions(filePath, migrationSuggestions) {
  const { imports, suggestions } = migrationSuggestions;
  
  // Skip if no changes needed
  if (suggestions.length === 0) {
    return { 
      success: true, 
      message: 'No changes needed',
      changeCount: 0 
    };
  }
  
  // Read original content
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Create backup
  const backupPath = `${filePath}.bak`;
  fs.writeFileSync(backupPath, content);
  
  // Apply changes from bottom to top to preserve line numbers
  const sortedSuggestions = [...suggestions].sort((a, b) => b.startLine - a.startLine);
  
  let modifiedLines = [...lines];
  for (const suggestion of sortedSuggestions) {
    // Remove original lines
    modifiedLines.splice(
      suggestion.startLine, 
      suggestion.endLine - suggestion.startLine + 1, 
      suggestion.replacement
    );
  }
  
  // Add imports if needed
  if (imports.length > 0) {
    const importContext = coreScanner.getImportContext(content);
    
    if (importContext.lastImportLine >= 0) {
      // Add after existing imports
      modifiedLines.splice(
        importContext.lastImportLine + 1,
        0,
        ...imports.map(imp => `${importContext.indentation}${imp}`)
      );
    } else {
      // Add at the beginning
      modifiedLines.unshift(...imports, '');
    }
  }
  
  // Write modified content
  fs.writeFileSync(filePath, modifiedLines.join('\n'));
  
  return {
    success: true,
    message: `Applied ${suggestions.length} changes to ${filePath}`,
    changeCount: suggestions.length,
    backupPath
  };
}

/**
 * Check for signature compatibility between mock functions
 * 
 * @param {string} originalMock Original mock code
 * @param {string} standardMock Standardized mock name
 * @returns {object} Compatibility analysis
 */
function checkMockCompatibility(originalMock, standardMock) {
  // Extract the standard mock's function signature
  const standardSignature = {
    'createMockNextRequest': {
      parameters: ['options'],
      returnTypes: ['NextRequest'],
      sideEffects: false
    },
    'mockNextResponseJson': {
      parameters: ['body', 'options'],
      returnTypes: ['NextResponse'],
      sideEffects: false
    },
    'redis': {
      functions: ['get', 'set', 'del', 'keys', 'sadd', 'smembers', 'srem', 'ping'],
      isStore: true,
      sideEffects: false
    }
  };
  
  // Analyze the original mock
  const originalSignature = {
    parameters: [],
    returnTypes: [],
    sideEffects: originalMock.includes('mockImplementation')
  };
  
  // Extract parameters if possible
  const paramMatch = originalMock.match(/\((.*?)\)/);
  if (paramMatch) {
    originalSignature.parameters = paramMatch[1].split(',')
      .map(p => p.trim())
      .filter(p => p !== '');
  }
  
  // Check for return types
  if (originalMock.includes('NextRequest')) {
    originalSignature.returnTypes.push('NextRequest');
  }
  if (originalMock.includes('NextResponse')) {
    originalSignature.returnTypes.push('NextResponse');
  }
  
  // Get the standard signature to compare with
  const standardInfo = standardSignature[standardMock];
  
  // Simple compatibility check
  const isCompatible = (
    // Check parameters count
    originalSignature.parameters.length <= standardInfo.parameters.length &&
    // Check return types
    originalSignature.returnTypes.every(t => standardInfo.returnTypes.includes(t))
  );
  
  // Provide detailed compatibility information
  return {
    isCompatible,
    originalSignature,
    standardSignature: standardInfo,
    potentialIssues: isCompatible ? [] : [
      originalSignature.parameters.length > standardInfo.parameters.length 
        ? `Original mock uses ${originalSignature.parameters.length} parameters, but standard mock only accepts ${standardInfo.parameters.length}` 
        : null,
      originalSignature.returnTypes.some(t => !standardInfo.returnTypes.includes(t))
        ? `Original mock returns ${originalSignature.returnTypes.join(', ')}, but standard mock returns ${standardInfo.returnTypes.join(', ')}`
        : null,
      originalSignature.sideEffects && !standardInfo.sideEffects
        ? 'Original mock has side effects that may not be preserved'
        : null
    ].filter(Boolean)
  };
}

// Export the module
module.exports = {
  generateMigrationSuggestions,
  applyMigrationSuggestions,
  checkMockCompatibility
};