const fs = require('fs');
const path = require('path');

// Find all test files with syntax errors
function findTestsWithSyntaxErrors(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findTestsWithSyntaxErrors(filePath, fileList);
      }
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for specific syntax error patterns
        let hasSyntaxErrors = false;

        // Pattern 1: "// Mock for => {" followed by "(X as jest.Mock" and then "const => {"
        if (content.includes('// Mock for =>') &&
            content.includes('as jest.Mock') &&
            content.includes('const =>')) {
          hasSyntaxErrors = true;
        }

        // Pattern 2: "// Mock for ;" followed by "(X as jest.Mock" and then "const ;"
        if (content.includes('// Mock for ;') &&
            content.includes('as jest.Mock') &&
            content.includes('const ;')) {
          hasSyntaxErrors = true;
        }

        // Pattern 3: Standalone "const ;" lines
        if (content.match(/^\s*const\s*;\s*$/m)) {
          hasSyntaxErrors = true;
        }

        // Pattern 4: Standalone "const => {" lines
        if (content.match(/^\s*const\s*=>\s*\{\s*$/m)) {
          hasSyntaxErrors = true;
        }

        // Pattern 5: "(X as jest.Mock" followed by "const ;" or "const => {"
        if (content.match(/\([^)]+\)\s*as\s*jest\.Mock[\s\S]{1,20}const\s*[;=]/)) {
          hasSyntaxErrors = true;
        }

        if (hasSyntaxErrors) {
          fileList.push({
            filePath,
            content
          });
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
  });

  return fileList;
}

// Fix syntax errors in a file
function fixSyntaxErrors(testInfo, dryRun = true) {
  const { filePath, content: originalContent } = testInfo;
  let content = originalContent;
  const fixes = [];

  // Let's take a more direct approach to fix the syntax errors
  // We'll use a line-by-line approach to identify and fix specific patterns

  // Split the content into lines
  const lines = content.split('\n');
  const newLines = [];

  // Keep track of variables that need to be mocked
  const mockVariables = new Set();

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for lines with "(X as jest.Mock" without a semicolon or assignment
    if (line.match(/\(\s*[\w\.]+\s*as\s*jest\.Mock\s*$/) &&
        (i === lines.length - 1 || !lines[i + 1].includes('='))) {
      // Extract the variable name
      const match = line.match(/\(\s*([\w\.]+)\s*as\s*jest\.Mock/);
      if (match) {
        const variableName = match[1].trim();
        mockVariables.add(variableName);

        // Skip this line
        fixes.push({
          type: 'remove-incomplete-mock-line',
          variableName
        });
        continue;
      }
    }

    // Check for lines with "const ;" or "const => {"
    if (line.match(/^\s*const\s*;\s*$/) || line.match(/^\s*const\s*=>\s*\{\s*$/)) {
      // Skip this line
      fixes.push({
        type: 'remove-const-line'
      });
      continue;
    }

    // Check for lines with "// Mock for ;" or "// Mock for => {"
    if (line.match(/\/\/\s*Mock for\s*;\s*$/) || line.match(/\/\/\s*Mock for\s*=>\s*\{\s*$/)) {
      // Skip this line
      fixes.push({
        type: 'remove-mock-for-line'
      });
      continue;
    }

    // Add the line to the new content
    newLines.push(line);
  }

  // Add mock implementations for all the variables we found
  mockVariables.forEach(variableName => {
    newLines.push(`// Mock ${variableName}`);
    newLines.push(`${variableName} = jest.fn();`);
    newLines.push('');

    fixes.push({
      type: 'add-mock-implementation',
      variableName
    });
  });

  // Join the lines back into a single string
  const newContent = newLines.join('\n');

  // Check if we made any changes
  const contentChanged = newContent !== originalContent;

  // Write the changes to the file if we made any changes and we're not in dry run mode
  if (contentChanged && !dryRun) {
    try {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed syntax errors in ${filePath}`);
    } catch (error) {
      console.error(`Error writing to file ${filePath}:`, error);
    }
  }

  return fixes;
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);

  // Find tests with syntax errors
  const testsWithSyntaxErrors = [
    ...findTestsWithSyntaxErrors(path.join(process.cwd(), 'tests')),
    ...findTestsWithSyntaxErrors(path.join(process.cwd(), 'src'))
  ];

  console.log(`Found ${testsWithSyntaxErrors.length} tests with syntax errors`);

  // Fix syntax errors
  const fixes = [];
  testsWithSyntaxErrors.forEach(testInfo => {
    const testFixes = fixSyntaxErrors(testInfo, dryRun);
    if (testFixes.length > 0) {
      fixes.push({
        file: testInfo.filePath,
        fixes: testFixes
      });
    }
  });

  console.log(`Applied ${fixes.reduce((sum, item) => sum + item.fixes.length, 0)} fixes to ${fixes.length} files`);

  // Print details of fixes
  if (fixes.length > 0) {
    console.log('\nFixes applied:');
    fixes.forEach((fileFixInfo, index) => {
      console.log(`\n${index + 1}. File: ${fileFixInfo.file}`);
      const fixesByType = {};
      fileFixInfo.fixes.forEach(fix => {
        if (!fixesByType[fix.type]) {
          fixesByType[fix.type] = 0;
        }
        fixesByType[fix.type]++;
      });

      Object.entries(fixesByType).forEach(([type, count]) => {
        console.log(`   - Fixed ${count} ${type} errors`);
      });
    });
  }

  return { testsWithSyntaxErrors, fixes };
}

// Run the script in live mode
const result = main(false);
module.exports = { result, main };
