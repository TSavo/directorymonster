// Script to run only the fixed hook tests
const { execSync } = require('child_process');

try {
  console.log('Running fixed hook tests...');
  
  // Run the fixed useLoginAttemptsMap test
  console.log('\nRunning useLoginAttemptsMap test...');
  execSync('npx jest src/components/admin/security/hooks/__tests__/useLoginAttemptsMap.test.ts -t "updates when filter changes - with debug"', 
    { stdio: 'inherit' });
  
  // Run the fixed useLoginAttempts test
  console.log('\nRunning useLoginAttempts test...');
  execSync('npx jest src/components/admin/security/hooks/__tests__/useLoginAttempts.test.ts -t "updates when filter changes - with debug"', 
    { stdio: 'inherit' });
  
  // Run the useSecurityMetrics tests
  console.log('\nRunning useSecurityMetrics tests...');
  execSync('npx jest src/components/admin/security/hooks/__tests__/useSecurityMetrics.test.ts', 
    { stdio: 'inherit' });
  
  console.log('\nAll fixed hook tests completed successfully!');
} catch (error) {
  console.error('Error running fixed hook tests:', error.message);
  process.exit(1);
}
