// Create a custom npm script in package.json to always use --json
// Then we can run: npm run test-json [test-file-pattern]

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * This script runs Jest with the --json flag and outputs the results to the console
 * Usage: node run-jest-json.js [test-file-pattern]
 */

// Get any arguments passed to this script
const args = process.argv.slice(2);

// Build the Jest command with --json flag
console.log('Running jest with JSON output...');

// Use direct jest path instead of npx
const result = spawnSync('node', [
  path.join(__dirname, 'node_modules', '.bin', 'jest'),
  '--json',
  ...args
], { 
  stdio: 'pipe',
  encoding: 'utf-8'
});

if (result.error) {
  console.error('Error running Jest:', result.error);
  process.exit(1);
}

const output = result.stdout;

try {
  // Make sure we have valid JSON
  if (output && output.trim() && output.includes('{')) {
    // Find where the JSON starts (after any warnings or logs)
    const jsonStart = output.indexOf('{');
    const jsonPart = output.substring(jsonStart);
    
    // Try to parse it
    const result = JSON.parse(jsonPart);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('No valid JSON output received from Jest');
    console.log(output);
  }
} catch (error) {
  console.error('Error parsing Jest JSON output:', error);
  console.log('Raw output:');
  console.log(output);
}

// Pass through the exit code from Jest
process.exit(result.status);