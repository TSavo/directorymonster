/**
 * Core Scanner Module
 * 
 * Provides the base functionality for scanning test files and identifying
 * non-standard mock patterns.
 */

const fs = require('fs');
const path = require('path');

/**
 * Find all test files in the specified directories
 * 
 * @param {string[]} directories Array of directory paths to scan
 * @param {RegExp} [filePattern] Pattern to match files (default: test files)
 * @returns {string[]} Array of file paths
 */
function findTestFiles(directories, filePattern = /\.(test|spec)\.(js|ts|tsx)$/i) {
  const testFiles = [];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }
    
    scanDirectory(dir, testFiles, filePattern);
  }
  
  return testFiles;
}

/**
 * Recursively scan a directory for test files
 * 
 * @param {string} dirPath Directory to scan
 * @param {string[]} results Array to populate with file paths
 * @param {RegExp} filePattern Pattern to match files
 */
function scanDirectory(dirPath, results, filePattern) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, results, filePattern);
    } else if (entry.isFile() && filePattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
}

/**
 * Scan a file for specified patterns
 * 
 * @param {string} filePath Path to the file to scan
 * @param {object} patterns Object with pattern name keys and RegExp values
 * @param {RegExp[]} ignorePatterns Array of patterns to ignore
 * @returns {object} Object with scan results
 */
function scanFile(filePath, patterns, ignorePatterns = []) {
  // Skip files that match ignore patterns
  if (ignorePatterns.some(pattern => pattern.test(filePath))) {
    return {
      filePath,
      hasNonStandardMocks: false,
      matches: {}
    };
  }
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check each pattern
  const matches = {};
  let hasNonStandardMocks = false;
  
  for (const [patternName, pattern] of Object.entries(patterns)) {
    const patternMatches = content.match(pattern);
    
    if (patternMatches && patternMatches.length > 0) {
      hasNonStandardMocks = true;
      
      // Find line numbers and context for each match
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
  
  return {
    filePath,
    content,
    hasNonStandardMocks,
    matches
  };
}

/**
 * Identify imports needed based on patterns found
 * 
 * @param {string} fileContent File content
 * @param {object} mockTypeImports Mapping of mock types to import statements
 * @param {object} matches Pattern matches found in the file
 * @returns {string[]} Array of import statements needed
 */
function identifyNeededImports(fileContent, mockTypeImports, matches) {
  const imports = [];
  
  // Check each mock type
  for (const [mockType, importStatement] of Object.entries(mockTypeImports)) {
    // If we found matches for this mock type
    if (matches[mockType] && matches[mockType].count > 0) {
      // And the import doesn't already exist
      if (!fileContent.includes(importStatement.split(' ')[1])) {
        imports.push(importStatement);
      }
    }
  }
  
  return imports;
}

/**
 * Extract import statement context from a file
 * 
 * @param {string} fileContent File content
 * @returns {object} Import context information
 */
function getImportContext(fileContent) {
  const lines = fileContent.split('\n');
  let lastImportLine = -1;
  
  // Find the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportLine = i;
    }
  }
  
  return {
    lastImportLine,
    indentation: lastImportLine >= 0 ? lines[lastImportLine].match(/^\s*/)[0] : ''
  };
}

/**
 * Check if a file needs standardization
 * 
 * @param {string} filePath Path to the file to check
 * @param {object} patterns Patterns to search for
 * @param {RegExp[]} ignorePatterns Patterns to ignore
 * @returns {boolean} True if the file needs standardization
 */
function fileNeedsStandardization(filePath, patterns, ignorePatterns = []) {
  const scanResult = scanFile(filePath, patterns, ignorePatterns);
  return scanResult.hasNonStandardMocks;
}

module.exports = {
  findTestFiles,
  scanFile,
  identifyNeededImports,
  getImportContext,
  fileNeedsStandardization
};