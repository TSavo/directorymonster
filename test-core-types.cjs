/**
 * Test script to verify core type definitions in the TypeScript files
 */
const fs = require('fs');
const path = require('path');

// List of files to check
const FILES_TO_CHECK = [
  'test-generator/Core/HandlebarsEngine.ts',
  'test-generator/Core/Config.ts',
  'test-generator/Core/Template.ts',
  'test-generator/Utils/FileSystem.ts'
];

// Regular expressions to check for TypeScript features
const TYPE_ANNOTATIONS_REGEX = /:\s*(string|number|boolean|any|Record<|Map<|Promise<|void|null|\[\]|\{\}|[A-Z][A-Za-z]*(\[\])?|[A-Z][A-Za-z]*<)/g;
const INTERFACE_REGEX = /interface\s+([A-Za-z0-9_]+)/g;
const TYPED_FUNCTION_REGEX = /(function|static|async)\s+[A-Za-z0-9_]+\([^)]*\):\s*(string|number|boolean|any|Record<|Map<|Promise<|void|null|\[\]|\{\}|[A-Z][A-Za-z]*(\[\])?|[A-Z][A-Za-z]*<)/g;
const PRIVATE_MEMBERS_REGEX = /private\s+[A-Za-z0-9_]+/g;

// Run the test
function testCoreTypes() {
  console.log('Testing TypeScript core type definitions...\n');
  
  let overallSuccess = true;
  
  for (const filePath of FILES_TO_CHECK) {
    console.log(`Checking ${filePath}...`);
    
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ File not found: ${fullPath}`);
        overallSuccess = false;
        continue;
      }
      
      // Read the file content
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      
      // Check for TypeScript features
      const typeAnnotations = fileContent.match(TYPE_ANNOTATIONS_REGEX) || [];
      const interfaces = fileContent.match(INTERFACE_REGEX) || [];
      const typedFunctions = fileContent.match(TYPED_FUNCTION_REGEX) || [];
      const privateMembers = fileContent.match(PRIVATE_MEMBERS_REGEX) || [];
      
      // Determine if the file has TypeScript features
      const hasTypeAnnotations = typeAnnotations.length > 0;
      const hasInterfaces = interfaces.length > 0;
      const hasTypedFunctions = typedFunctions.length > 0;
      const hasPrivateMembers = privateMembers.length > 0;
      
      // Print results
      console.log(`  Type Annotations: ${hasTypeAnnotations ? '✅ Found' : '❌ Not found'} (${typeAnnotations.length})`);
      console.log(`  Interfaces: ${hasInterfaces ? '✅ Found' : '❌ Not found'} (${interfaces.length})`);
      console.log(`  Typed Functions: ${hasTypedFunctions ? '✅ Found' : '❌ Not found'} (${typedFunctions.length})`);
      console.log(`  Private Members: ${hasPrivateMembers ? '✅ Found' : '❌ Not found'} (${privateMembers.length})`);
      
      // Check overall success for this file
      const fileSuccess = hasTypeAnnotations && (hasInterfaces || hasTypedFunctions || hasPrivateMembers);
      console.log(`  Overall: ${fileSuccess ? '✅ TypeScript features found' : '❌ Insufficient TypeScript features'}`);
      
      // Update overall success
      overallSuccess = overallSuccess && fileSuccess;
    } catch (error) {
      console.error(`❌ Error checking ${filePath}: ${error.message}`);
      overallSuccess = false;
    }
    
    console.log(''); // Empty line between files
  }
  
  // Final summary
  console.log(`\nOverall TypeScript conversion check: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  return overallSuccess;
}

// Run the test and exit with appropriate code
const result = testCoreTypes();
process.exit(result ? 0 : 1);
