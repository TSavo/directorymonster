const { spawn } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);

console.log('Running tests with minimal output...');

// Add flags to minimize output but still get test names
const minimalArgs = [
  'jest',
  '--no-watchman',
  '--colors',
  '--verbose', // Enable verbose output to get test names
  '--testPathIgnorePatterns=tests/e2e', // Always exclude e2e tests
  ...args
];

// Execute Jest with verbose flag to get more test information
const child = spawn('npx', minimalArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: process.platform === 'win32'
});

// Keep track of test failures
let output = '';

// Process the output to extract just test names and error messages
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
  let errorSection = false;
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
      errorSection = true;
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

  // Special handling for PermissionGuard test failures
  if (output.includes('PermissionGuard') || args.some(arg => arg.includes('PermissionGuard'))) {
    const permGuardFilePattern = /src\/components\/admin\/auth\/guards\/__tests__\/PermissionGuard\.test\.tsx/;
    let permGuardFile = testFiles.find(file => permGuardFilePattern.test(file));

    if (!permGuardFile && testFiles.length > 0) {
      permGuardFile = testFiles[0];
    } else if (!permGuardFile) {
      permGuardFile = "src/components/admin/auth/guards/__tests__/PermissionGuard.test.tsx";
    }

    // Extract permission guard specific errors
    const mockErrors = [];
    const permGuardTestErrors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Mock not defined errors
      if (line.includes('ReferenceError: mock') && line.includes('is not defined')) {
        mockErrors.push({
          file: permGuardFile,
          name: `PermissionGuard test`,
          error: line
        });
      }

      // Permission guard test failures
      if (line.includes('PermissionGuard') && line.match(/^\s*●\s/)) {
        const testName = line.replace(/^\s*●\s+/, '').trim();
        let errorMsg = 'Test failed';

        // Look ahead for error message
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.includes('at ') && !nextLine.includes('node_modules/')) {
            errorMsg = nextLine;
            break;
          }
        }

        permGuardTestErrors.push({
          file: permGuardFile,
          name: testName,
          error: errorMsg
        });
      }
    }

    // Add these errors to our failures list
    failedTests.push(...mockErrors);
    failedTests.push(...permGuardTestErrors);
  }

  // Handle invariant errors specially - they appear differently in the output
  if ((failedTests.length === 0 ||
      failedTests.every(f => !f.error.includes('invariant'))) &&
      output.includes('invariant')) {

    const invariantMatches = output.match(/Error: (invariant.+?)(?:\n|$)/g);
    if (invariantMatches && invariantMatches.length > 0) {
      // If we have test files but no specific failures found
      if (testFiles.length > 0) {
        // Associate invariant errors with test files
        const uniqueTestFiles = [...new Set(testFiles)];
        invariantMatches.forEach((match, index) => {
          const testFile = uniqueTestFiles[index % uniqueTestFiles.length];

          // Try to find the test name from the file content
          let testName = '';
          const fileLines = lines.filter(line => line.includes(testFile));
          for (const fileLine of fileLines) {
            const nextIndex = lines.indexOf(fileLine) + 1;
            if (nextIndex < lines.length) {
              // Look for test names in the following lines
              for (let j = nextIndex; j < Math.min(nextIndex + 10, lines.length); j++) {
                if (lines[j].match(/^\s*(PASS|FAIL)\s+/)) {
                  testName = lines[j].replace(/^\s*(PASS|FAIL)\s+/, '').trim();
                  break;
                }
              }
            }
            if (testName) break;
          }

          // If no specific test name found, try to get it from all tests
          if (!testName) {
            const matchingTests = allTests.filter(t => t.file === testFile);
            if (matchingTests.length > 0) {
              testName = matchingTests[0].name;
            }
          }

          // Still no test name? Use the file path
          if (!testName) {
            testName = `Test in ${testFile}`;
          }

          failedTests.push({
            file: testFile,
            name: testName,
            error: match.trim().replace('Error: ', '')
          });
        });
      }
    }
  }

  // Handle punycode warnings
  if (output.includes('punycode') &&
      failedTests.every(f => !f.error.includes('punycode'))) {
    // Only add this if we have test files and it's not already captured
    if (testFiles.length > 0) {
      failedTests.push({
        file: testFiles[0],
        name: allTests.length > 0 ? allTests[0].name : `Test in ${testFiles[0]}`,
        error: 'Warning: The `punycode` module is deprecated. Please use a userland alternative instead.'
      });
    }
  }

  // If we still couldn't find any specific tests but have files
  if (failedTests.length === 0 && testFiles.length > 0 && code !== 0) {
    testFiles.forEach(file => {
      failedTests.push({
        file: file,
        name: `Test in ${file}`,
        error: 'Unknown error (test failed but couldn\'t extract error message)'
      });
    });
  }

  // Last resort: Look for any line with '● ' that might indicate a test failure
  if (failedTests.length === 0 && code !== 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^\s*●\s/) && !line.includes('●●●')) {
        // Got a test name, try to find a file and error
        const testName = line.replace(/^\s*●\s+/, '').trim();
        let testFile = testFiles.length > 0 ? testFiles[0] : "Unknown file";
        let errorMsg = "Unknown error";

        // Look ahead for error message
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.includes('at ') && !nextLine.includes('node_modules/')) {
            errorMsg = nextLine;
            break;
          }
        }

        failedTests.push({
          file: testFile,
          name: testName,
          error: errorMsg
        });
      }
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
    // Last resort - just show exit code and check if the string "error" appears anywhere
    console.log('\nTests failed with exit code: ' + code);

    if (testFiles.length > 0) {
      console.log('Failed test files:');
      testFiles.forEach(file => {
        console.log(`- ${file}`);
      });
    }

    // Grab any line with "error" in it as a hint
    const errorHints = lines
      .filter(line => (line.toLowerCase().includes('error') ||
                      line.toLowerCase().includes('fail') ||
                      line.match(/^\s*●\s/)) &&
                      !line.includes('●●●'))
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.includes('at '))
      .slice(0, 3);

    if (errorHints.length > 0) {
      console.log('Possible errors detected:');
      errorHints.forEach(hint => {
        console.log(`- ${hint}`);
        // Try to find a file for this error
        if (testFiles.length > 0) {
          console.log(`  File: ${testFiles[0]}`);
        } else if (args.length > 0 && args[0].endsWith('.tsx')) {
          console.log(`  File: ${args[0]}`);
        }
      });
    }
  } else {
    console.log('All tests passed.');
  }
});