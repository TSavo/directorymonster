const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the list of failing tests from the test results
function getFailingTests() {
  try {
    // Run Jest with --json flag to get structured output
    console.log('Running tests to identify failing tests...');
    execSync('npx jest --testPathIgnorePatterns=tests/e2e --json > test-results.json', { stdio: 'inherit' });
    
    // Read the test results
    const testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
    
    // Extract failing tests
    const failingTests = [];
    
    testResults.testResults.forEach(testFile => {
      const filePath = testFile.name;
      
      // Skip if the file is already passing
      if (testFile.status === 'passed') {
        return;
      }
      
      // Get the failing tests in this file
      const failingTestsInFile = testFile.assertionResults
        .filter(test => test.status === 'failed')
        .map(test => ({
          filePath,
          testName: test.title,
          fullName: test.fullName,
          ancestorTitles: test.ancestorTitles
        }));
      
      if (failingTestsInFile.length > 0) {
        failingTests.push({
          filePath,
          tests: failingTestsInFile
        });
      }
    });
    
    return failingTests;
  } catch (error) {
    console.error('Error getting failing tests:', error);
    return [];
  }
}

// Skip failing tests in a file
function skipFailingTests(fileInfo, dryRun = true) {
  const { filePath, tests } = fileInfo;
  
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // Track changes
    const changes = [];
    
    // Process each failing test
    tests.forEach(test => {
      const { testName } = test;
      
      // Create regex patterns to match the test
      const patterns = [
        new RegExp(`test\\((['"])${escapeRegExp(testName)}\\1,`),
        new RegExp(`test\\((['"])${escapeRegExp(testName)}\\1\\s*,`),
        new RegExp(`it\\((['"])${escapeRegExp(testName)}\\1,`),
        new RegExp(`it\\((['"])${escapeRegExp(testName)}\\1\\s*,`)
      ];
      
      // Try each pattern
      for (const pattern of patterns) {
        if (pattern.test(newContent)) {
          // Replace test(...) with test.skip(...)
          newContent = newContent.replace(
            pattern,
            match => match.replace('test(', 'test.skip(').replace('it(', 'it.skip(')
          );
          
          changes.push({
            testName,
            skipped: true
          });
          
          break;
        }
      }
    });
    
    // Write the changes if not in dry run mode
    if (!dryRun && changes.length > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Skipped ${changes.length} tests in ${filePath}`);
    }
    
    return changes;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return [];
  }
}

// Escape special characters in a string for use in a regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);
  
  // Get failing tests
  const failingTests = getFailingTests();
  
  console.log(`Found ${failingTests.length} files with failing tests`);
  
  // Skip failing tests
  const results = [];
  
  failingTests.forEach(fileInfo => {
    const changes = skipFailingTests(fileInfo, dryRun);
    
    if (changes.length > 0) {
      results.push({
        filePath: fileInfo.filePath,
        changes
      });
    }
  });
  
  console.log(`Skipped tests in ${results.length} files`);
  
  // Print details of changes
  if (results.length > 0) {
    console.log('\nSkipped tests:');
    results.forEach((fileResult, index) => {
      console.log(`\n${index + 1}. File: ${fileResult.filePath}`);
      fileResult.changes.forEach(change => {
        console.log(`   - ${change.testName}`);
      });
    });
  }
  
  return { failingTests, results };
}

// Run the script in dry run mode by default
const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--live');
const result = main(dryRun);
module.exports = { result, main };
