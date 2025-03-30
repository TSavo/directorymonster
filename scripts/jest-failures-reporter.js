/**
 * A minimal Jest reporter that only outputs failing test file paths.
 */
class FailuresOnlyReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.failingTestPaths = new Map(); // Store path and failure count
  }

  onTestResult(test, testResult) {
    if (testResult.numFailingTests > 0 || testResult.testExecError) {
      // Store the failing test path and number of failures
      const numFailures = testResult.numFailingTests || 
                         (testResult.testExecError ? 1 : 0);
      
      // Get failure messages
      const failureMessages = testResult.testResults
        .filter(result => result.status === 'failed')
        .map(result => result.fullName || result.title);
      
      this.failingTestPaths.set(test.path, {
        numFailures,
        failureMessages
      });
    }
  }

  onRunComplete(contexts, results) {
    if (this.failingTestPaths.size === 0) {
      console.log("\nAll tests passed!");
    } else {
      console.log(`\n❌ Found ${this.failingTestPaths.size} failing test files:\n`);
      
      // Display each failing test path
      Array.from(this.failingTestPaths.entries())
        .sort((a, b) => b[1].numFailures - a[1].numFailures) // Sort by number of failures
        .forEach(([path, details]) => {
          // Extract the relative path from the project root
          const relativePath = path.split('directorymonster')[1].replace(/\\/g, '/');
          console.log(`• ${relativePath} (${details.numFailures} failing ${details.numFailures === 1 ? 'test' : 'tests'})`);
        });
      
      console.log(`\nTotal: ${results.numFailedTests} failures in ${this.failingTestPaths.size} files`);
    }
  }
}

module.exports = FailuresOnlyReporter;