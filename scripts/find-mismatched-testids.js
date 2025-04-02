const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to find all component files from a barrel file
function findComponentsFromBarrel(barrelFilePath) {
  if (!fs.existsSync(barrelFilePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(barrelFilePath, 'utf8');
    const componentFiles = [];

    // Match export statements
    const exportRegex = /export\s+(?:\{[^}]*\}|\*\s+as\s+[^;]+|[^;{]*)\s+from\s+['"]\.\/(.*)['"];?/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      const componentName = match[1];
      const componentDir = path.dirname(barrelFilePath);
      const componentPath = path.join(componentDir, componentName);

      // Add extensions if not present
      if (!path.extname(componentPath)) {
        const extensions = ['.tsx', '.jsx', '.ts', '.js'];

        for (const ext of extensions) {
          const pathWithExt = `${componentPath}${ext}`;
          if (fs.existsSync(pathWithExt)) {
            componentFiles.push(pathWithExt);
            break;
          }
        }
      } else if (fs.existsSync(componentPath)) {
        componentFiles.push(componentPath);
      }
    }

    return componentFiles;
  } catch (error) {
    console.error(`Error reading barrel file ${barrelFilePath}: ${error.message}`);
    return [];
  }
}

// Function to extract data-testid attributes from component files
function extractComponentTestIds(filePath) {
  try {
    // Check if it's a directory
    if (fs.statSync(filePath).isDirectory()) {
      return {
        filePath,
        testIds: []
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const testIds = new Set();

    // Match data-testid="something" in JSX
    const dataTestIdRegex = /data-testid=["']([^"']+)["']/g;
    let match;

    while ((match = dataTestIdRegex.exec(content)) !== null) {
      testIds.add(match[1]);
    }

    // If this is a barrel file (index.ts/js), also extract test IDs from the files it exports
    if (path.basename(filePath).startsWith('index.') && content.includes('export')) {
      const componentFiles = findComponentsFromBarrel(filePath);
      for (const componentFile of componentFiles) {
        const componentTestIds = extractComponentTestIds(componentFile).testIds;
        for (const id of componentTestIds) {
          testIds.add(id);
        }
      }
    }

    return {
      filePath,
      testIds: Array.from(testIds)
    };
  } catch (error) {
    console.log(`Error processing file ${filePath}: ${error.message}`);
    return {
      filePath,
      testIds: []
    };
  }
}

// Function to extract data-testid references from test files
function extractTestFileTestIds(filePath) {
  try {
    // Check if it's a directory
    if (fs.statSync(filePath).isDirectory()) {
      return {
        filePath,
        testIds: []
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const testIds = new Set();

    // Match getByTestId('something'), queryByTestId('something'), etc.
    const getByTestIdRegex = /(?:getByTestId|queryByTestId|findByTestId|getAllByTestId|queryAllByTestId|findAllByTestId)\(["']([^"']+)["']\)/g;
    let match;

    while ((match = getByTestIdRegex.exec(content)) !== null) {
      testIds.add(match[1]);
    }

    return {
      filePath,
      testIds: Array.from(testIds)
    };
  } catch (error) {
    console.log(`Error processing test file ${filePath}: ${error.message}`);
    return {
      filePath,
      testIds: []
    };
  }
}

// Function to extract import statements from a file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];

    // Match import statements
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^;]+|[^;{]*)\s+from\s+['"]([@/][^'"]+)['"];?/g;
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

// Function to find the corresponding component file for a test file
function findCorrespondingComponentFile(testFilePath) {
  // First try to find component files based on imports
  const imports = extractImports(testFilePath);
  const resolvedImports = imports.map(imp => resolveImportPath(imp, testFilePath));

  // Check for barrel files and extract components from them
  let allComponentFiles = [];

  for (const importPath of resolvedImports) {
    // First check if it's a direct file import
    const directFile = findFileFromImport(importPath);
    if (directFile) {
      allComponentFiles.push(directFile);
      continue;
    }

    // Check if it's a directory import (barrel file)
    const indexFile = findFileFromImport(path.join(importPath, 'index'));
    if (indexFile) {
      const barrelComponents = findComponentsFromBarrel(indexFile);
      allComponentFiles = [...allComponentFiles, ...barrelComponents];
    }
  }

  if (allComponentFiles.length > 0) {
    return allComponentFiles;
  }

  // If no imports found, fall back to the original approach
  const testFileName = path.basename(testFilePath);
  const componentName = testFileName.replace(/\.test\.(tsx|jsx|ts|js)$/, '');

  // Look for component files with the same name - limit the search to avoid excessive scanning
  const pattern1 = `src/**/${componentName}.{tsx,jsx,ts,js}`;
  const componentFiles = glob.sync(pattern1, { nodir: true, ignore: ['**/node_modules/**', '**/dist/**'] });

  if (componentFiles.length === 0) {
    // Try a more targeted approach if no exact match is found
    // Convert test path to potential component path
    // e.g., tests/admin/components/Button.test.tsx -> src/components/admin/Button
    const testPathWithoutExt = testFilePath.replace(/\.test\.(tsx|jsx|ts|js)$/, '');
    const possibleComponentDir = testPathWithoutExt
      .replace(/^tests\//, 'src/')
      .replace(/^tests\\/, 'src\\');

    // Look for component files in a more limited scope
    // Only look one level deep from the potential component directory
    const pattern2 = `${possibleComponentDir}.{tsx,jsx,ts,js}`;
    const pattern3 = `${possibleComponentDir}/*.{tsx,jsx,ts,js}`;

    const componentFilesInDir = [
      ...glob.sync(pattern2, { nodir: true, ignore: ['**/node_modules/**', '**/dist/**'] }),
      ...glob.sync(pattern3, { nodir: true, ignore: ['**/node_modules/**', '**/dist/**'] })
    ];

    return componentFilesInDir;
  }

  return componentFiles;
}

// Main function to find mismatches
function findMismatchedTestIds() {
  // Get all test files, excluding node_modules and dist
  const testFiles = glob.sync('tests/**/*.test.{tsx,jsx,ts,js}', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });

  console.log(`Found ${testFiles.length} test files`);

  const mismatches = [];
  let processedCount = 0;

  // Process files in batches to avoid memory issues
  const batchSize = 20;
  const batches = [];

  for (let i = 0; i < testFiles.length; i += batchSize) {
    batches.push(testFiles.slice(i, i + batchSize));
  }

  console.log(`Split into ${batches.length} batches of up to ${batchSize} files each`);

  batches.forEach((batch, batchIndex) => {
    console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);

    batch.forEach(testFile => {
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`Processing file ${processedCount}/${testFiles.length}: ${testFile}`);
      }

      const testFileTestIds = extractTestFileTestIds(testFile);

      if (testFileTestIds.testIds.length === 0) {
        return; // Skip if no test IDs found
      }

      const componentFiles = findCorrespondingComponentFile(testFile);

      if (componentFiles.length === 0) {
        mismatches.push({
          testFile,
          error: 'No corresponding component file found',
          testIds: testFileTestIds.testIds
        });
        return;
      }

      // Extract test IDs from all potential component files
      const componentTestIds = new Set();
      componentFiles.forEach(componentFile => {
        const ids = extractComponentTestIds(componentFile).testIds;
        ids.forEach(id => componentTestIds.add(id));
      });

      // Find test IDs in the test file that don't exist in any component file
      const missingTestIds = testFileTestIds.testIds.filter(id => !componentTestIds.has(id));

      if (missingTestIds.length > 0) {
        mismatches.push({
          testFile,
          componentFiles,
          missingTestIds
        });
      }
    });
  });

  return mismatches;
}

// Run the analysis
const mismatches = findMismatchedTestIds();

// Save the mismatches to a file
const mismatchedTestIdsFile = 'mismatched-testids.json';
fs.writeFileSync(mismatchedTestIdsFile, JSON.stringify(mismatches, null, 2));
console.log(`Saved ${mismatches.length} mismatched test IDs to ${mismatchedTestIdsFile}`);

// Output the results
console.log('\n=== MISMATCHED DATA-TESTID ATTRIBUTES ===');
console.log(`Found ${mismatches.length} test files with mismatched data-testid attributes.\n`);

if (mismatches.length > 0) {
  console.log('DETAILED RESULTS:');
  console.log('----------------');

  mismatches.forEach((mismatch, index) => {
    console.log(`\n${index + 1}. Test file: ${mismatch.testFile}`);

    if (mismatch.error) {
      console.log(`   Error: ${mismatch.error}`);
      console.log(`   Test IDs used: ${mismatch.testIds.join(', ')}`);
    } else {
      console.log(`   Component files:`);
      mismatch.componentFiles.forEach(file => {
        console.log(`     - ${file}`);
      });
      console.log(`   Missing test IDs:`);
      mismatch.missingTestIds.forEach(id => {
        console.log(`     - ${id}`);
      });
    }
  });

  console.log('\n=== SUMMARY OF ACTIONS NEEDED ===');
  console.log('To fix these issues, either:');
  console.log('1. Update the component files to include the missing data-testid attributes');
  console.log('2. Update the test files to use the correct data-testid attributes');
  console.log('3. If using mocks, ensure the mocks provide the same data-testid attributes as the real components');
}

console.log('\nScript completed successfully.');
