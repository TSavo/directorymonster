const glob = require('glob');

// Get the component file path from command line arguments
const componentFilePath = process.argv[2];

if (!componentFilePath) {
  console.error('Please provide a component file path');
  process.exit(1);
}

// Extract the component name from the file path
const componentName = componentFilePath.split('/').pop().replace(/\.[^.]+$/, '');

// Look for test files with the same name
const testFilePatterns = [
  `tests/**/${componentName}.test.{tsx,jsx,ts,js}`,
  `tests/**/${componentName}.*.test.{tsx,jsx,ts,js}`
];

let foundTestFiles = false;

for (const pattern of testFilePatterns) {
  const testFiles = glob.sync(pattern);
  if (testFiles.length > 0) {
    console.log(testFiles.join('\n'));
    foundTestFiles = true;
    break;
  }
}

if (!foundTestFiles) {
  // If no test file found with the same name, try to infer from the component path
  const componentPathParts = componentFilePath.split(/[\\/]/);
  const componentDir = componentPathParts.slice(0, -1).join('/');
  
  // Convert src path to tests path
  // e.g., src/components/admin/categories -> tests/admin/categories
  const testDir = componentDir.replace(/^src\/components/, 'tests');
  
  const testFiles = glob.sync(`${testDir}/**/*.test.{tsx,jsx,ts,js}`);
  if (testFiles.length > 0) {
    console.log(testFiles.join('\n'));
  }
}
