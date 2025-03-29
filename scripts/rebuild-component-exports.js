/**
 * Rebuilds all component index exports to ensure proper module resolution
 * Run with: node scripts/rebuild-component-exports.js
 */

const fs = require('fs');
const path = require('path');

// Define base component directories
const COMPONENT_DIRS = [
  'src/components/admin/sites',
  'src/components/admin/categories',
  'src/components/admin/layout',
  'src/components/admin/listings',
  'src/components/admin/dashboard',
  'src/components/admin/auth',
  'src/components/search',
];

/**
 * Creates or updates an index.ts file with exports for all .tsx files in the directory
 */
function generateIndexExports(dirPath) {
  try {
    console.log(`Processing directory: ${dirPath}`);
    
    // Skip if directory doesn't exist
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`);
      // Create the directory
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
      return false;
    }
    
    // Get all .tsx files in the directory
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.tsx') && !file.includes('.test.'))
      .map(file => path.basename(file, '.tsx'));
    
    if (files.length === 0) {
      console.log(`No .tsx files found in ${dirPath}`);
      return false;
    }
    
    // Generate exports content
    let indexContent = '// Auto-generated index file - DO NOT EDIT\n';
    indexContent += '// Generated on: ' + new Date().toISOString() + '\n\n';
    
    // Generate named exports
    files.forEach(file => {
      indexContent += `export { ${file} } from './${file}';\n`;
    });
    
    // Add default exports as named exports
    indexContent += '\n// Default exports as named exports\n';
    files.forEach(file => {
      indexContent += `import ${file}Default from './${file}';\n`;
    });
    
    indexContent += '\n// Additional named exports\nexport {\n';
    files.forEach(file => {
      indexContent += `  ${file}Default,\n`;
    });
    indexContent += '};\n';
    
    // Create default export object
    indexContent += '\n// Default export object\nexport default {\n';
    files.forEach(file => {
      indexContent += `  ${file}: ${file}Default,\n`;
    });
    indexContent += '};\n';
    
    // Write the index.ts file
    const indexPath = path.join(dirPath, 'index.ts');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log(`Generated index file: ${indexPath} with ${files.length} components`);
    return true;
  } catch (error) {
    console.error(`Error processing ${dirPath}:`, error);
    return false;
  }
}

/**
 * Process all subdirectories recursively
 */
function processRecursively(baseDir) {
  // Generate index.ts for the base directory
  generateIndexExports(baseDir);
  
  // Check for subdirectories
  try {
    const subDirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .filter(dirent => !dirent.name.startsWith('.')) // Skip hidden directories
      .map(dirent => path.join(baseDir, dirent.name));
    
    // Process each subdirectory
    subDirs.forEach(subDir => {
      generateIndexExports(subDir);
      processRecursively(subDir); // Recursive call
    });
  } catch (error) {
    console.error(`Error reading subdirectories in ${baseDir}:`, error);
  }
}

// Main execution
console.log('Starting component index rebuild...');

// Process all component directories
let successCount = 0;
COMPONENT_DIRS.forEach(dir => {
  if (generateIndexExports(dir)) {
    successCount++;
  }
  
  // Process subdirectories
  processRecursively(dir);
});

console.log(`Component index rebuild complete. Successfully processed ${successCount} directories.`);
console.log('Remember to rebuild Docker container to apply changes.');
