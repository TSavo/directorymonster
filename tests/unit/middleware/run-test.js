/**
 * This script runs the secure-tenant-context test directly 
 */

// Run the jest test
console.log('Running secure-tenant-context test...');

// Import Jest
require('jest');

// Run the test
const { run } = require('jest-cli');

// Buffer to store JSON output
let jsonOutput = '';
const originalStdoutWrite = process.stdout.write;

// Override stdout.write to capture JSON output
process.stdout.write = function(chunk, encoding, callback) {
  const str = chunk.toString();
  
  // Capture the JSON part of the output
  if (str.includes('{') && str.includes('"success"')) {
    jsonOutput += str;
  }
  
  // Still write to stdout
  return originalStdoutWrite.apply(process.stdout, arguments);
};

// Configure and run with json output
run(['--config', 'jest.config.js', '--json', 'secure-tenant-context.test.ts'])
  .then(() => {
    // Restore stdout.write
    process.stdout.write = originalStdoutWrite;
    
    try {
      // Extract the JSON part
      const jsonStart = jsonOutput.indexOf('{');
      const jsonEnd = jsonOutput.lastIndexOf('}') + 1;
      const jsonStr = jsonOutput.substring(jsonStart, jsonEnd);
      
      // Parse the JSON result
      const result = JSON.parse(jsonStr);
      const success = result.success === true;
      
      console.log('Test execution completed with ' + (success ? 'success' : 'failure'));
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('Error parsing test results:', error);
      process.exit(1);
    }
  })
  .catch(error => {
    // Restore stdout.write
    process.stdout.write = originalStdoutWrite;
    
    console.error('Test execution failed:', error);
    process.exit(1);
  });