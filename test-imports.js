/**
 * Simple test script to verify that the TypeScript modules can be imported
 */

// First, list the modules we expect to be able to import
const modules = [
  './test-generator/Core/HandlebarsEngine.js',
  './test-generator/Core/Config.js',
  './test-generator/Core/Template.js',
  './test-generator/Utils/FileSystem.js'
];

// Attempt to dynamically import each module
async function testImports() {
  let success = true;
  
  console.log('Testing module imports...');
  
  for (const modulePath of modules) {
    try {
      console.log(`Importing ${modulePath}...`);
      const module = await import(modulePath);
      
      if (module) {
        console.log(`✅ Successfully imported ${modulePath}`);
      } else {
        console.error(`❌ Failed to import ${modulePath} - module is undefined`);
        success = false;
      }
    } catch (error) {
      console.error(`❌ Failed to import ${modulePath}: ${error.message}`);
      success = false;
    }
  }
  
  return success;
}

// Run the test
testImports().then(result => {
  console.log(`\nImport test ${result ? 'PASSED' : 'FAILED'}`);
  process.exit(result ? 0 : 1);
}).catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
