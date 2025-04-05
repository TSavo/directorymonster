// Script to run only security component tests, skipping hook tests
const { execSync } = require('child_process');

try {
  console.log('Running security component tests...');
  execSync('npx jest src/components/admin/security/__tests__', { stdio: 'inherit' });
  console.log('Security component tests completed successfully!');
} catch (error) {
  console.error('Error running security component tests:', error.message);
  process.exit(1);
}
