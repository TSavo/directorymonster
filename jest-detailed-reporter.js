class DetailedFailureReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.failures = [];
  }

  onRunComplete(contexts, results) {
    console.log('\n=== DETAILED TEST FAILURE SUMMARY ===\n');

    if (results.numFailedTests === 0) {
      console.log('All tests passed!');
      return;
    }

    console.log(`Failed Tests: ${results.numFailedTests}`);
    console.log(`Total Tests: ${results.numTotalTests}`);
    console.log('');

    // Group failures by error message
    const errorGroups = {};

    // Process test results
    results.testResults.forEach(testFile => {
      const failedTests = testFile.testResults.filter(test => test.status === 'failed');

      if (failedTests.length > 0) {
        failedTests.forEach(test => {
          // Extract error message
          const errorMessage = test.failureMessages[0] || 'Unknown error';
          const errorType = this.getErrorType(errorMessage);

          if (!errorGroups[errorType]) {
            errorGroups[errorType] = {
              count: 0,
              tests: []
            };
          }

          errorGroups[errorType].count++;
          errorGroups[errorType].tests.push({
            testName: test.title,
            testPath: testFile.testFilePath,
            errorMessage: errorMessage
          });
        });
      }
    });

    // Print error groups
    console.log('=== ERROR GROUPS ===\n');

    Object.keys(errorGroups).forEach(errorType => {
      const group = errorGroups[errorType];
      console.log(`\n${errorType} (${group.count} tests)`);

      // Print up to 5 examples
      const examples = group.tests.slice(0, 5);
      examples.forEach((test, index) => {
        console.log(`\n  ${index + 1}. ${test.testName}`);
        console.log(`     File: ${test.testPath}`);
      });

      if (group.tests.length > 5) {
        console.log(`\n  ... and ${group.tests.length - 5} more tests with the same error`);
      }

      // Print a sample stack trace for the first test
      if (group.tests.length > 0) {
        const firstTest = group.tests[0];
        console.log('\n  Sample Error:');

        // Format the error message for better readability
        const formattedError = this.formatErrorMessage(firstTest.errorMessage);
        console.log(`\n${formattedError}`);
      }
    });

    console.log('\n=== END OF DETAILED FAILURE SUMMARY ===\n');
  }

  getErrorType(errorMessage) {
    // Extract the error type from the error message
    if (errorMessage.includes('document is not defined')) {
      return 'ReferenceError: document is not defined';
    } else if (errorMessage.includes('window is not defined')) {
      return 'ReferenceError: window is not defined';
    } else if (errorMessage.includes('invariant expected app router to be mounted')) {
      return 'Error: invariant expected app router to be mounted';
    } else if (errorMessage.includes('net::ERR_CONNECTION_REFUSED')) {
      return 'Error: net::ERR_CONNECTION_REFUSED';
    } else if (errorMessage.includes('Timeout')) {
      return 'Error: Timeout';
    } else if (errorMessage.includes('AggregateError')) {
      return 'AggregateError';
    } else if (errorMessage.includes('Warning: React does not recognize the')) {
      return 'Warning: React does not recognize props';
    } else if (errorMessage.includes('Warning: validateDOMNesting')) {
      return 'Warning: validateDOMNesting';
    } else if (errorMessage.includes('Not implemented: HTMLFormElement.prototype.requestSubmit')) {
      return 'Error: Not implemented: HTMLFormElement.prototype.requestSubmit';
    } else if (errorMessage.includes('Cannot find module')) {
      return 'Error: Cannot find module';
    } else {
      // Extract the first line of the error message
      const firstLine = errorMessage.split('\n')[0];
      return firstLine || 'Unknown error';
    }
  }

  formatErrorMessage(errorMessage) {
    // Format the error message for better readability
    const lines = errorMessage.split('\n');

    // Extract the first 10 lines of the stack trace
    const stackTrace = lines.slice(0, 10).join('\n    ');

    return `    ${stackTrace}`;
  }
}

module.exports = DetailedFailureReporter;
