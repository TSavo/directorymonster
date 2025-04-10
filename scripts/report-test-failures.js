/**
 * Script to parse Jest test results and report failures
 * Run this after running jest with --json flag
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Read the test results file
const resultsPath = path.join(process.cwd(), 'test-results.json');

try {
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  // Count total failures
  const totalFailures = results.numFailedTests;
  const totalTests = results.numTotalTests;
  const totalTestSuites = results.numTotalTestSuites;
  const failedTestSuites = results.numFailedTestSuites;
  
  console.log(chalk.bold('\n===== TEST FAILURE REPORT =====\n'));
  console.log(chalk.bold(`Total Test Suites: ${totalTestSuites}, Failed: ${failedTestSuites}`));
  console.log(chalk.bold(`Total Tests: ${totalTests}, Failed: ${totalFailures}\n`));
  
  if (totalFailures === 0) {
    console.log(chalk.green.bold('All tests passed! 🎉'));
    process.exit(0);
  }
  
  // Group failures by file
  const failuresByFile = {};
  
  results.testResults.forEach(testSuite => {
    if (testSuite.status === 'failed') {
      const filePath = testSuite.name.replace(process.cwd(), '');
      
      if (!failuresByFile[filePath]) {
        failuresByFile[filePath] = [];
      }
      
      testSuite.assertionResults
        .filter(test => test.status === 'failed')
        .forEach(test => {
          failuresByFile[filePath].push({
            name: test.fullName || test.title,
            error: test.failureMessages.join('\n')
          });
        });
    }
  });
  
  // Print failures by file
  Object.keys(failuresByFile).forEach(filePath => {
    console.log(chalk.red.bold(`\nFile: ${filePath}`));
    console.log(chalk.red(`Failed Tests: ${failuresByFile[filePath].length}`));
    
    failuresByFile[filePath].forEach((failure, index) => {
      console.log(chalk.yellow(`\n${index + 1}. ${failure.name}`));
      
      // Extract and print a simplified error message
      const errorLines = failure.error.split('\n');
      const simplifiedError = errorLines
        .filter(line => !line.includes('node_modules') && !line.includes('    at '))
        .join('\n')
        .replace(/\\u001b\[\d+m/g, ''); // Remove ANSI color codes
      
      console.log(chalk.gray(simplifiedError));
    });
  });
  
  console.log(chalk.bold('\n===== END OF REPORT =====\n'));
  
  // Suggest next steps
  console.log(chalk.cyan('Suggested next steps:'));
  console.log(chalk.cyan('1. Fix the most common failures first'));
  console.log(chalk.cyan('2. Run specific tests with:'));
  console.log(chalk.cyan(`   npm test ${Object.keys(failuresByFile)[0]}`));
  console.log(chalk.cyan('3. Run this report again to check progress:'));
  console.log(chalk.cyan('   npm run test:failures\n'));
  
} catch (error) {
  console.error(chalk.red('Error parsing test results:'), error);
  process.exit(1);
}
