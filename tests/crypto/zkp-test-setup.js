/**
 * Setup file for ZKP tests
 *
 * This file is loaded before running ZKP tests and sets up the environment
 * for testing ZKP functionality.
 */

const fs = require('fs');
const path = require('path');

// Increase timeout for all ZKP tests
jest.setTimeout(60000);

// Check if required circuit files exist
const requiredCircuitFiles = [
  'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm',
  'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey',
  'circuits/zkp_auth/simple_auth_output/verification_key.json'
];

// Function to check if all required circuit files exist
const checkCircuitFiles = () => {
  const missingFiles = requiredCircuitFiles.filter(file => {
    const filePath = path.join(process.cwd(), file);
    return !fs.existsSync(filePath);
  });

  return {
    allFilesExist: missingFiles.length === 0,
    missingFiles
  };
};

// Set global variables for test environment
global.ZKP_TEST_ENV = {
  // Check if we should use mocks or real implementations
  useMocks: process.env.ZKP_USE_MOCKS === 'true',

  // Check if circuit files exist
  circuitFiles: checkCircuitFiles(),

  // Store test artifacts path
  artifactsPath: path.join(process.cwd(), 'tests/crypto/artifacts')
};

// Create artifacts directory if it doesn't exist
if (!fs.existsSync(global.ZKP_TEST_ENV.artifactsPath)) {
  fs.mkdirSync(global.ZKP_TEST_ENV.artifactsPath, { recursive: true });
}

// Log ZKP test environment setup
console.log('ZKP Test Environment:', {
  useMocks: global.ZKP_TEST_ENV.useMocks,
  circuitFilesExist: global.ZKP_TEST_ENV.circuitFiles.allFilesExist,
  missingFiles: global.ZKP_TEST_ENV.circuitFiles.missingFiles
});

// Skip tests that require circuit files if they don't exist
beforeEach(() => {
  if (!global.ZKP_TEST_ENV.useMocks && !global.ZKP_TEST_ENV.circuitFiles.allFilesExist) {
    const missingFiles = global.ZKP_TEST_ENV.circuitFiles.missingFiles.join(', ');
    console.warn(`Skipping test because circuit files are missing: ${missingFiles}`);
    jest.fn();
  }
});
