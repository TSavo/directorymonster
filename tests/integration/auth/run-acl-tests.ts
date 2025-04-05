/**
 * Run ACL Integration Tests
 * Utility script to run all ACL integration tests with appropriate configuration
 */

import { run } from 'jest-cli';

// Configure and run the tests
run([
  '--config', 'jest.config.js',
  '--testMatch', '**/tests/integration/auth/*test.ts',
  '--runInBand', // Run tests sequentially for better stability
  '--forceExit'  // Force exit after tests complete
])
  .then(success => {
    console.log('Test execution completed with ' + (success ? 'success' : 'failure'));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
