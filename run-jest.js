const { runCLI } = require('@jest/core');
const fs = require('fs');

// Run Jest with JSON reporter
runCLI(
  {
    json: true,
    silent: true
  },
  [process.cwd()]
).then(({ results }) => {
  // Write results to file
  fs.writeFileSync('jest-results-clean.json', JSON.stringify(results, null, 2));
  
  // Extract failing tests
  const failingTests = [];
  
  results.testResults.forEach(testSuite => {
    if (testSuite.status === 'failed') {
      const failedTestsInSuite = testSuite.assertionResults
        .filter(test => test.status === 'failed')
        .map(test => ({
          testPath: testSuite.name,
          testName: test.fullName || test.title,
          failureMessage: test.failureMessages.join('\n')
        }));
      
      failingTests.push(...failedTestsInSuite);
    }
  });
  
  // Print summary
  console.log(`Total failing tests: ${failingTests.length}`);
  console.log('\nFailing tests:');
  failingTests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.testName}`);
    console.log(`   File: ${test.testPath}`);
    console.log(`   Error: ${test.failureMessage.split('\n')[0]}`);
  });
});
