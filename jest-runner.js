#!/usr/bin/env node

/**
 * Consolidated Jest runner script
 * This script provides various modes for running Jest tests with different output options
 *
 * Usage: node jest-runner.js [options] [test files or patterns]
 *
 * Options:
 *   --mode=<mode>  Run tests in a specific mode (balanced, quiet, minimal, failures-only, default)
 *   --with-e2e     Flag kept for backward compatibility (e2e tests are now included by default)
 *
 * Examples:
 *   node jest-runner.js                                  # Run all tests in balanced mode
 *   node jest-runner.js --mode=balanced                  # Run all tests with balanced output (default)
 *   node jest-runner.js --mode=quiet                     # Run all tests with minimal console output
 *   node jest-runner.js --mode=minimal                   # Run all tests with custom minimal formatter
 *   node jest-runner.js --mode=failures-only             # Run only tests that failed in the previous run
 *   node jest-runner.js --with-e2e                       # Run all tests (including e2e tests - kept for backward compatibility)
 *   node jest-runner.js tests/unit/api/admin             # Run specific tests
 */

const { spawnSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let mode = 'balanced';
// E2E tests are now included by default
let testArgs = [];

// Process arguments to extract mode and other options
args.forEach(arg => {
  if (arg.startsWith('--mode=')) {
    mode = arg.replace('--mode=', '');
  } else if (arg === '--with-e2e') {
    // E2E tests are now included by default - flag is kept for backward compatibility
  } else {
    testArgs.push(arg);
  }
});

// Base Jest arguments
let jestArgs = [];

// E2E tests are now included by default
// No exclusion needed

// Configure mode-specific arguments
switch (mode) {
  case 'quiet':
    console.log('Running tests in quiet mode...');
    jestArgs = [
      ...jestArgs,
      '--silent',           // Prevent tests from printing console.log statements
      '--noStackTrace',     // Disable stack trace in test failures
      '--verbose=false',    // Disable verbose output
    ];
    break;

  case 'minimal':
    console.log('Running tests with minimal output...');
    // Use the existing minimal-test.js implementation
    // This is a special case that uses a custom output processor
    const { spawn } = require('child_process');

    // E2E tests are now included by default
    // No exclusion needed

    // Execute Jest with verbose flag to get more test information
    const minimalArgs = [
      'jest',
      '--no-watchman',
      '--colors',
      '--verbose', // Enable verbose output to get test names
      ...testArgs
    ];

    console.log(`Running: npx ${minimalArgs.join(' ')}`);

    const child = spawn('npx', minimalArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });

    // Use the existing minimal-test.js implementation for processing output
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      const lines = output.split('\n');
      const failedTests = [];
      const testFiles = [];
      const allTests = [];

      // First pass: extract all test files and test names
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Capture test file name
        if (line.match(/^FAIL\s+(.+)$/i)) {
          const testFile = line.replace(/^FAIL\s+/i, '').trim();
          testFiles.push(testFile);
        }

        // Capture any test name in verbose output (PASS or FAIL)
        if (line.match(/^\s*(PASS|FAIL)\s+/)) {
          const testName = line.replace(/^\s*(PASS|FAIL)\s+/, '').trim();
          if (testName) {
            allTests.push({
              name: testName,
              file: testFiles[testFiles.length - 1] || 'Unknown test file'
            });
          }
        }
      }

      // Second pass: extract failures
      let currentTestFile = '';
      let errorMessage = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Update current test file
        if (line.match(/^FAIL\s+(.+)$/i)) {
          currentTestFile = line.replace(/^FAIL\s+/i, '').trim();
        }

        // Identify failed test blocks
        if (line.match(/^\s*●\s/)) {
          const testName = line.replace(/^\s*●\s+/, '').trim();
          errorMessage = '';

          // Look ahead for error message
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j].trim();

            // Skip empty lines, stack traces, and line numbers
            if (nextLine === '' ||
                nextLine.includes('at ') ||
                nextLine.includes('node_modules/') ||
                nextLine.match(/^\s*\d+\s*\|/)) {
              continue;
            }

            // Found potential error message
            errorMessage = nextLine;
            break;
          }

          // Find matching test from our test list or use default
          const matchedTest = allTests.find(t => testName.includes(t.name)) ||
                              { name: testName, file: currentTestFile };

          failedTests.push({
            file: matchedTest.file,
            name: matchedTest.name,
            error: errorMessage || 'Unknown error'
          });
        }
      }

      // Display minimal test failure information
      if (failedTests.length > 0) {
        console.log('\nFailed Tests:');
        // Remove duplicates by converting to strings and using Set
        const uniqueFailures = [...new Set(failedTests.map(f => JSON.stringify(f)))].map(f => JSON.parse(f));

        // Format the file paths for better readability
        uniqueFailures.forEach(failure => {
          // Extract just the filename from the path
          const filePathParts = failure.file.split(/[\/\\]/);
          const fileName = filePathParts[filePathParts.length - 1];

          // Add shortened file info to the test name if not already there
          if (!failure.name.includes(fileName)) {
            failure.displayName = `${failure.name} (${fileName})`;
          } else {
            failure.displayName = failure.name;
          }
        });

        uniqueFailures.forEach((failure, index) => {
          console.log(`${index + 1}. ${failure.displayName}`);
          console.log(`   File: ${failure.file}`);
          console.log(`   Reason: ${failure.error}`);
        });
        console.log(`\n${uniqueFailures.length} tests failed.`);
      } else if (code !== 0) {
        console.log('\nTests failed with exit code: ' + code);
      } else {
        console.log('All tests passed.');
      }

      process.exit(code);
    });

    // Exit early since we're handling this case specially
    return;

  case 'failures-only':
    console.log('Running tests (failures only)...');
    jestArgs = [
      ...jestArgs,
      '--silent',           // Prevent tests from printing console.log statements
      '--onlyFailures',     // Only run tests that failed in the previous run
    ];
    break;

  case 'balanced':
    console.log('Running tests in balanced mode...');
    jestArgs = [
      ...jestArgs,
      '--noStackTrace',     // Disable stack trace in test failures
      '--verbose=false',    // Disable verbose output
    ];
    break;

  case 'default':
  default:
    console.log('Running tests in default mode...');
    // No additional arguments needed for default mode
    break;
}

// Add any remaining test arguments
jestArgs = [...jestArgs, ...testArgs];

// Log the command being run
console.log(`Running: npx jest ${jestArgs.join(' ')}`);

// Run Jest synchronously
const result = spawnSync('npx', ['jest', ...jestArgs], {
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as Jest
process.exit(result.status);
