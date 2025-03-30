/**
 * Run component tests one by one
 * 
 * This script will run each component test separately and report which ones pass/fail
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log file to store test results
const LOG_FILE = path.join(__dirname, 'component-tests-results.log');

// Function to run a single test file and capture results
function runTest(testFile) {
  console.log(`\nRunning test: ${testFile}`);
  try {
    // Run test with Jest, capturing output
    const output = execSync(
      `npx jest ${testFile} --no-cache --colors=false`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Test passed
    console.log(`✅ PASSED: ${testFile}`);
    fs.appendFileSync(LOG_FILE, `\n\n=== PASSED: ${testFile} ===\n${output}`);
    return { file: testFile, passed: true, output };
  } catch (error) {
    // Test failed
    console.error(`❌ FAILED: ${testFile}`);
    fs.appendFileSync(LOG_FILE, `\n\n=== FAILED: ${testFile} ===\n${error.stdout || error.message}`);
    return { file: testFile, passed: false, output: error.stdout || error.message };
  }
}

// Start with a fresh log file
fs.writeFileSync(LOG_FILE, `Component Tests Results - ${new Date().toISOString()}\n`);

// Get a list of all component test files based on patterns in component-tests.js
const componentTests = [
  'tests/components/**/*.test.{ts,tsx}',
  'tests/admin/auth/**/*.test.{ts,tsx}',
  'tests/admin/categories/**/*.test.{ts,tsx}',
  'tests/admin/dashboard/**/*.test.{ts,tsx}',
  'tests/admin/layout/**/*.test.{ts,tsx}',
  'tests/admin/listings/**/*.test.{ts,tsx}',
  'tests/admin/navigation/**/*.test.{ts,tsx}',
  'tests/admin/sites/**/*.test.{ts,tsx}',
];

// Use Jest to get the list of test files matching the patterns
try {
  const jestListCommand = `npx jest --listTests --json --testPathPattern="(tests/components/|tests/admin/auth/|tests/admin/categories/|tests/admin/dashboard/|tests/admin/layout/|tests/admin/listings/|tests/admin/navigation/|tests/admin/sites/)"`;
  const testList = JSON.parse(execSync(jestListCommand, { encoding: 'utf8' }));
  
  // Filter out integration tests and api tests as per component-tests.js
  const filteredTests = testList.filter(file => {
    return !file.includes('.api.test.') && 
           !file.includes('.integration.test.') &&
           !file.includes('/integration/');
  });
  
  // Results storage
  const results = {
    passed: [],
    failed: []
  };
  
  console.log(`Found ${filteredTests.length} component tests to run...`);
  
  // Run each test file one by one
  filteredTests.forEach((testFile, index) => {
    console.log(`\n[${index + 1}/${filteredTests.length}] Testing: ${testFile}`);
    const result = runTest(testFile);
    
    if (result.passed) {
      results.passed.push(result.file);
    } else {
      results.failed.push(result.file);
    }
  });
  
  // Summary
  console.log('\n==== TEST SUMMARY ====');
  console.log(`Total tests: ${filteredTests.length}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(file => console.log(`- ${file}`));
    console.log(`\nCheck ${LOG_FILE} for detailed error messages.`);
  }
  
} catch (error) {
  console.error('Error listing test files:', error.message);
}