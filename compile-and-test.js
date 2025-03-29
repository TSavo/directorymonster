/**
 * Script to compile TypeScript files and run the test
 */
const { spawn } = require('child_process');
const path = require('path');

// First compile TypeScript files
console.log('Compiling TypeScript files...');
const tsc = spawn('npx', ['tsc', '--project', 'tsconfig.json'], { shell: true });

tsc.stdout.on('data', (data) => {
  console.log(`tsc output: ${data}`);
});

tsc.stderr.on('data', (data) => {
  console.error(`tsc error: ${data}`);
});

tsc.on('close', (code) => {
  console.log(`tsc process exited with code ${code}`);
  
  if (code === 0) {
    // Compilation succeeded, now run the test
    console.log('Running tests...');
    
    // Use node to run the compiled JavaScript
    const testProcess = spawn('node', ['dist/test-typescript.js'], { shell: true });
    
    testProcess.stdout.on('data', (data) => {
      console.log(`${data}`);
    });
    
    testProcess.stderr.on('data', (data) => {
      console.error(`${data}`);
    });
    
    testProcess.on('close', (testCode) => {
      console.log(`Test process exited with code ${testCode}`);
      process.exit(testCode);
    });
  } else {
    // Compilation failed
    process.exit(code);
  }
});
