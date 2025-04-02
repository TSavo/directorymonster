const fs = require('fs');
const path = require('path');

// Test ID patterns to standardize
const testIdPatterns = {
  // Button test IDs
  'form-next-button': 'next-button',
  'form-back-button': 'back-button',
  'form-submit-button': 'submit-button',
  'form-cancel-button': 'cancel-button',
  'save-button': 'submit-button',
  'cancel-button': 'cancel-button',
  
  // Form field test IDs
  'site-form-name': 'siteForm-name',
  'site-form-slug': 'siteForm-slug',
  'site-form-description': 'siteForm-description',
  'site-form-name-error': 'siteForm-name-error',
  'site-form-slug-error': 'siteForm-slug-error',
  'site-form-description-error': 'siteForm-description-error',
  
  // Dropdown test IDs
  'site-filter-dropdown-button': 'site-filter-dropdown',
  'dropdown-menu-content': 'dropdown-menu',
  
  // Domain step test IDs
  'domain-step-heading': 'domainStep-heading',
  'domain-step-domain-input': 'domainStep-domain-input',
  'domain-step-add-domain': 'domainStep-add-domain',
  
  // Admin header test IDs
  'admin-header-title': 'admin-header-title',
  'admin-header-user-menu': 'user-menu-button',
  'admin-header-notifications': 'notifications-button',
  
  // Admin sidebar test IDs
  'admin-sidebar-nav': 'admin-sidebar-nav',
  'admin-sidebar-close': 'close-sidebar',
  'admin-sidebar-toggle': 'sidebar-toggle'
};

// Function to recursively find all files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix test IDs in a file
function fixTestIds(filePath, dryRun = true) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const changes = [];
    
    // Check for data-testid attributes
    const dataTestIdRegex = /data-testid=["']([^"']+)["']/g;
    const dataTestIdMatches = [...content.matchAll(dataTestIdRegex)];
    
    dataTestIdMatches.forEach(match => {
      const oldTestId = match[1];
      
      // Check if this test ID needs to be standardized
      if (testIdPatterns[oldTestId]) {
        const newTestId = testIdPatterns[oldTestId];
        const oldAttribute = `data-testid="${oldTestId}"`;
        const newAttribute = `data-testid="${newTestId}"`;
        
        changes.push({
          type: 'data-testid',
          file: filePath,
          oldTestId,
          newTestId,
          oldAttribute,
          newAttribute
        });
        
        if (!dryRun) {
          content = content.replace(oldAttribute, newAttribute);
        }
      }
    });
    
    // Check for getByTestId, queryByTestId, findByTestId calls
    const getByTestIdRegex = /(getByTestId|queryByTestId|findByTestId)\(["']([^"']+)["']\)/g;
    const getByTestIdMatches = [...content.matchAll(getByTestIdRegex)];
    
    getByTestIdMatches.forEach(match => {
      const method = match[1];
      const oldTestId = match[2];
      
      // Check if this test ID needs to be standardized
      if (testIdPatterns[oldTestId]) {
        const newTestId = testIdPatterns[oldTestId];
        const oldCall = `${method}("${oldTestId}")`;
        const newCall = `${method}("${newTestId}")`;
        
        changes.push({
          type: 'getByTestId',
          file: filePath,
          oldTestId,
          newTestId,
          oldCall,
          newCall
        });
        
        if (!dryRun) {
          content = content.replace(oldCall, newCall);
        }
        
        // Also check for single quotes
        const oldCallSingleQuotes = `${method}('${oldTestId}')`;
        const newCallSingleQuotes = `${method}('${newTestId}')`;
        
        if (content.includes(oldCallSingleQuotes)) {
          changes.push({
            type: 'getByTestId',
            file: filePath,
            oldTestId,
            newTestId,
            oldCall: oldCallSingleQuotes,
            newCall: newCallSingleQuotes
          });
          
          if (!dryRun) {
            content = content.replace(oldCallSingleQuotes, newCallSingleQuotes);
          }
        }
      }
    });
    
    // If there are changes and this is not a dry run, write the changes back to the file
    if (changes.length > 0 && !dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
    return changes;
  } catch (error) {
    console.error(`Error fixing test IDs in ${filePath}:`, error);
    return [];
  }
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);
  
  // Find all files
  const rootDir = process.cwd();
  const allFiles = findFiles(rootDir);
  console.log(`Found ${allFiles.length} files`);
  
  // Fix test IDs
  const changes = [];
  allFiles.forEach(file => {
    const fileChanges = fixTestIds(file, dryRun);
    changes.push(...fileChanges);
  });
  
  console.log(`Found ${changes.length} test ID issues to fix`);
  
  // Group changes by file
  const changesByFile = {};
  changes.forEach(change => {
    if (!changesByFile[change.file]) {
      changesByFile[change.file] = [];
    }
    changesByFile[change.file].push(change);
  });
  
  // Print the changes
  console.log('\nTest ID changes to be made:');
  Object.entries(changesByFile).forEach(([file, fileChanges]) => {
    console.log(`\nFile: ${file}`);
    fileChanges.forEach(change => {
      console.log(`- ${change.oldTestId} → ${change.newTestId}`);
    });
  });
  
  return { changes, changesByFile };
}

// Run the script in dry run mode
const result = main(true);

// Export the result for potential use in other scripts
module.exports = { result, main };
