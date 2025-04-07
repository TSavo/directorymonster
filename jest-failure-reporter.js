class FailureReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.failures = [];
  }

  onRunComplete(contexts, results) {
    console.log('\n=== TEST FAILURE SUMMARY ===\n');
    
    if (results.numFailedTests === 0) {
      console.log('All tests passed!');
      return;
    }
    
    console.log(`Failed Tests: ${results.numFailedTests}`);
    console.log(`Total Tests: ${results.numTotalTests}`);
    console.log('');
    
    // Process test results
    results.testResults.forEach(testFile => {
      const failedTests = testFile.testResults.filter(test => test.status === 'failed');
      
      if (failedTests.length > 0) {
        console.log(`\nFile: ${testFile.testFilePath}`);
        
        failedTests.forEach(test => {
          console.log(`\n  ✕ ${test.title}`);
          
          // Extract and format the first line of each failure message
          test.failureMessages.forEach(message => {
            const lines = message.split('\n');
            const errorMessage = lines.find(line => line.includes('Error:')) || lines[0];
            console.log(`    ${errorMessage.trim()}`);
          });
        });
      }
    });
    
    console.log('\n=== END OF FAILURE SUMMARY ===\n');
  }
}

module.exports = FailureReporter;
