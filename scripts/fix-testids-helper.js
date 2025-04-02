const fs = require('fs');
const path = require('path');
const glob = require('glob');

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

// Function to find the corresponding component file for a test file
function findCorrespondingComponentFile(testFilePath) {
  // Extract the component name from the test file path
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

// Function to generate a fix suggestion
function generateFixSuggestion(testFile, componentFiles, missingTestIds) {
  const testContent = fs.readFileSync(testFile, 'utf8');

  let componentContents = [];
  for (const componentFile of componentFiles) {
    try {
      const content = fs.readFileSync(componentFile, 'utf8');
      componentContents.push({ file: componentFile, content });
    } catch (error) {
      console.log(`Error reading component file ${componentFile}: ${error.message}`);
    }
  }

  // Generate suggestions
  let suggestions = `# Fix Suggestions for ${testFile}\n\n`;

  suggestions += `## Missing data-testid attributes\n\n`;
  suggestions += missingTestIds.map(id => `- \`${id}\`\n`).join('');

  suggestions += `\n## Component Files\n\n`;
  suggestions += componentFiles.map(file => `- ${file}\n`).join('');

  suggestions += `\n## Existing data-testid attributes in components\n\n`;

  const existingTestIds = new Set();
  for (const { file, content } of componentContents) {
    const dataTestIdRegex = /data-testid=["']([^"']+)["']/g;
    let match;
    while ((match = dataTestIdRegex.exec(content)) !== null) {
      existingTestIds.add(match[1]);
    }
  }

  suggestions += Array.from(existingTestIds).map(id => `- \`${id}\`\n`).join('');

  suggestions += `\n## Possible Solutions\n\n`;

  // Option 1: Update the component
  suggestions += `### Option 1: Update the component\n\n`;
  suggestions += `Add the missing data-testid attributes to the component:\n\n`;

  for (const id of missingTestIds) {
    suggestions += `\`\`\`jsx\ndata-testid="${id}"\n\`\`\`\n\n`;
  }

  // Option 2: Update the test
  suggestions += `### Option 2: Update the test\n\n`;
  suggestions += `Update the test to use existing data-testid attributes:\n\n`;

  for (const id of missingTestIds) {
    // Find similar existing test IDs
    const similarIds = Array.from(existingTestIds).filter(existingId => {
      return existingId.includes(id.replace(/[-_]/g, '')) ||
             id.includes(existingId.replace(/[-_]/g, ''));
    });

    if (similarIds.length > 0) {
      suggestions += `Replace \`${id}\` with one of: ${similarIds.map(s => `\`${s}\``).join(', ')}\n\n`;
    } else {
      suggestions += `No similar existing test IDs found for \`${id}\`\n\n`;
    }
  }

  // Option 3: Update mocks
  suggestions += `### Option 3: Update mocks\n\n`;
  suggestions += `If the test is using mocks, update them to include the missing data-testid attributes:\n\n`;

  const mockRegex = /jest\.mock\([^)]+\)/g;
  const mockMatches = testContent.match(mockRegex);

  if (mockMatches && mockMatches.length > 0) {
    suggestions += `Found potential mocks in the test file:\n\n`;
    suggestions += mockMatches.map(m => `\`\`\`js\n${m}\n\`\`\`\n\n`).join('');

    suggestions += `Consider updating these mocks to include the missing data-testid attributes.\n\n`;
  } else {
    suggestions += `No obvious mocks found in the test file. If you're using mocks, make sure they include the missing data-testid attributes.\n\n`;
  }

  return suggestions;
}

// File path for mismatched test IDs
const mismatchedTestIdsFile = 'mismatched-testids.json';

// Main function
function main() {
  // Read the mismatched test IDs file

  if (!fs.existsSync(mismatchedTestIdsFile)) {
    console.error(`File ${mismatchedTestIdsFile} not found. Please run find-mismatched-testids.js first and save the output to ${mismatchedTestIdsFile}.`);
    return;
  }

  const mismatchedData = JSON.parse(fs.readFileSync(mismatchedTestIdsFile, 'utf8'));

  // Create output directory
  const outputDir = 'testid-fix-suggestions';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Process each test file
  for (let i = 0; i < mismatchedData.length; i++) {
    const item = mismatchedData[i];

    if (item.error) {
      console.log(`Skipping ${item.testFile} due to error: ${item.error}`);
      continue;
    }

    console.log(`Processing ${i+1}/${mismatchedData.length}: ${item.testFile}`);

    const suggestion = generateFixSuggestion(item.testFile, item.componentFiles, item.missingTestIds);

    // Save the suggestion to a file
    const outputFile = path.join(outputDir, `${path.basename(item.testFile, path.extname(item.testFile))}-fix.md`);
    fs.writeFileSync(outputFile, suggestion);

    console.log(`Saved suggestion to ${outputFile}`);
  }

  console.log('\nAll done!');
  console.log(`Generated fix suggestions for ${mismatchedData.length} files with mismatched test IDs`);
  console.log(`Check the ${outputDir} directory for the suggestions.`);
}

// Save the mismatched test IDs to a file
function saveMismatchedTestIds() {
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

  // Save the data to a file
  fs.writeFileSync(mismatchedTestIdsFile, JSON.stringify(mismatches, null, 2));
  console.log(`Saved ${mismatches.length} mismatched test IDs to ${mismatchedTestIdsFile}`);

  // Now run the main function
  main();
}

// Start the process
saveMismatchedTestIds();
