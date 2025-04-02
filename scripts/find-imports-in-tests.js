const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to extract import statements from a file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match import statements
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^;]+|[^;{]*)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Only include imports from the project (not node_modules)
      if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
        imports.push(importPath);
      }
    }
    
    return imports;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return [];
  }
}

// Function to resolve import path to actual file path
function resolveImportPath(importPath, fromFile) {
  // Handle aliased imports (e.g., @/components/...)
  if (importPath.startsWith('@/')) {
    // Assuming @/ maps to src/
    return importPath.replace('@/', 'src/');
  }
  
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const fromDir = path.dirname(fromFile);
    return path.join(fromDir, importPath);
  }
  
  return importPath;
}

// Function to find actual file from import path
function findFileFromImport(importPath) {
  // Add extensions if not present
  if (!path.extname(importPath)) {
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    for (const ext of extensions) {
      const pathWithExt = `${importPath}${ext}`;
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }
    
    // Check for index files
    for (const ext of extensions) {
      const indexPath = path.join(importPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  } else if (fs.existsSync(importPath)) {
    return importPath;
  }
  
  return null;
}

// Main function
function main() {
  // Get all test files
  const testFiles = glob.sync('tests/**/*.test.{tsx,jsx,ts,js}', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  console.log(`Found ${testFiles.length} test files`);
  
  // Process each test file
  const results = [];
  
  for (const testFile of testFiles) {
    const imports = extractImports(testFile);
    const resolvedImports = imports.map(imp => resolveImportPath(imp, testFile));
    const actualFiles = resolvedImports
      .map(findFileFromImport)
      .filter(Boolean); // Remove nulls
    
    results.push({
      testFile,
      imports,
      resolvedImports,
      actualFiles
    });
  }
  
  // Output results
  console.log('\n=== IMPORT ANALYSIS ===');
  
  for (const result of results) {
    console.log(`\nTest file: ${result.testFile}`);
    console.log('Imports:');
    result.imports.forEach((imp, i) => {
      console.log(`  ${imp} -> ${result.actualFiles[i] || 'Not found'}`);
    });
  }
  
  // Save results to file
  fs.writeFileSync('test-imports.json', JSON.stringify(results, null, 2));
  console.log('\nSaved results to test-imports.json');
}

// Run the main function
main();
