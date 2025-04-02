const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix test names in a file
function fixTestNames(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace it.skip($2, ...) with it.skip('should be implemented', ...)
    const itSkipRegex = /it\.skip\(\$2,/g;
    if (itSkipRegex.test(content)) {
      content = content.replace(itSkipRegex, "it.skip('should be implemented',");
      modified = true;
    }
    
    // Replace test.skip($2, ...) with test.skip('should be implemented', ...)
    const testSkipRegex = /test\.skip\(\$2,/g;
    if (testSkipRegex.test(content)) {
      content = content.replace(testSkipRegex, "test.skip('should be implemented',");
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed test names in ${filePath}`);
      return true;
    } else {
      console.log(`No test names to fix in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Find all test files
function findTestFiles() {
  const testFiles = [
    ...glob.sync('tests/**/*.test.ts'),
    ...glob.sync('tests/**/*.test.tsx'),
    ...glob.sync('tests/**/*.test.js'),
    ...glob.sync('tests/**/*.test.jsx'),
    ...glob.sync('src/**/*.test.ts'),
    ...glob.sync('src/**/*.test.tsx'),
    ...glob.sync('src/**/*.test.js'),
    ...glob.sync('src/**/*.test.jsx')
  ];
  
  return testFiles;
}

// Main function
function main() {
  console.log('Fixing test names...');
  
  // Find all test files
  const testFiles = findTestFiles();
  console.log(`Found ${testFiles.length} test files`);
  
  // Fix test names in each file
  let fixedFiles = 0;
  testFiles.forEach(filePath => {
    const fixed = fixTestNames(filePath);
    if (fixed) {
      fixedFiles++;
    }
  });
  
  console.log(`Fixed test names in ${fixedFiles} files`);
}

// Run the script
main();
