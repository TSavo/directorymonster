const { main: updateComponentMocks } = require('./update-component-mocks');
const { main: fixComponentImports } = require('./fix-component-imports');
const { main: fixTestIds } = require('./fix-test-ids');

// Function to run all fixes
async function runAllFixes(dryRun = true) {
  console.log(`Running all fixes in ${dryRun ? 'dry run' : 'live'} mode...\n`);
  
  // Step 1: Update component mocks
  console.log('Step 1: Updating component mocks...');
  const mockResults = updateComponentMocks(dryRun);
  console.log('Component mock updates complete.\n');
  
  // Step 2: Fix component imports
  console.log('Step 2: Fixing component imports...');
  const importResults = fixComponentImports(dryRun);
  console.log('Component import fixes complete.\n');
  
  // Step 3: Fix test IDs
  console.log('Step 3: Fixing test IDs...');
  const testIdResults = fixTestIds(dryRun);
  console.log('Test ID fixes complete.\n');
  
  // Summary
  console.log('Fix Summary:');
  console.log(`- Component mock updates: ${mockResults.adminSidebarChanges ? 'AdminSidebar updated' : 'No AdminSidebar changes'}, ${mockResults.domainStepChanges ? 'DomainStep updated' : 'No DomainStep changes'}`);
  console.log(`- Component import fixes: ${importResults.importChanges.length} import issues, ${importResults.exportChanges.length} export issues`);
  console.log(`- Test ID fixes: ${testIdResults.changes.length} test ID issues`);
  
  return {
    mockResults,
    importResults,
    testIdResults
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.indexOf('--live') === -1;

// Run all fixes
runAllFixes(dryRun)
  .then(() => {
    console.log(`\nAll fixes ${dryRun ? 'would be' : 'have been'} applied.`);
    console.log(dryRun ? 'Run with --live to apply changes.' : 'Changes have been applied to the codebase.');
  })
  .catch(error => {
    console.error('Error running fixes:', error);
    process.exit(1);
  });
