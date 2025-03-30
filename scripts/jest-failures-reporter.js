/**
 * A minimal Jest reporter that only outputs failing test files
 * and writes them to a file.
 */
const fs = require('fs');
const path = require('path');

class FailuresOnlyReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.failingTestPaths = new Map(); // Store path and failure count
    this.outputFile = path.join(process.cwd(), 'failing-tests.log');
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
    let output = '';
    
    if (this.failingTestPaths.size === 0) {
      output = "All tests passed!\n";
      console.log("\nAll tests passed!");
    } else {
      output = `❌ Found ${this.failingTestPaths.size} failing test files:\n\n`;
      console.log(`\n❌ Found ${this.failingTestPaths.size} failing test files:\n`);
      
      // Display each failing test path
      Array.from(this.failingTestPaths.entries())
        .sort((a, b) => b[1].numFailures - a[1].numFailures) // Sort by number of failures
        .forEach(([path, details]) => {
          // Extract the relative path from the project root
          const relativePath = path.split('directorymonster')[1].replace(/\\/g, '/');
          const logLine = `• ${relativePath} (${details.numFailures} failing ${details.numFailures === 1 ? 'test' : 'tests'})`;
          
          console.log(logLine);
          output += logLine + '\n';
          
          // Add failure messages if available
          if (details.failureMessages && details.failureMessages.length > 0) {
            details.failureMessages.forEach(message => {
              const failMessage = `  - ${message}`;
              output += failMessage + '\n';
            });
            output += '\n';
          }
        });
      
      output += `\nTotal: ${results.numFailedTests} failures in ${this.failingTestPaths.size} files`;
      console.log(`\nTotal: ${results.numFailedTests} failures in ${this.failingTestPaths.size} files`);
    }
    
    // Write to file
    try {
      fs.writeFileSync(this.outputFile, output);
      console.log(`\nFailing tests written to: ${this.outputFile}`);
    } catch (error) {
      console.error(`Error writing to output file: ${error.message}`);
    }
  }
}

module.exports = FailuresOnlyReporter;