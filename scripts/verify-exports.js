/**
 * Verification script for export pattern standardization
 * 
 * This script checks component files and their exports to ensure they follow
 * the standardized pattern with both named and default exports. It also validates
 * that barrel files (index.ts) follow the correct pattern for re-exporting components.
 * 
 * Usage: node scripts/verify-exports.js [directory]
 * Example: node scripts/verify-exports.js src/components/admin
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default directory to check if none provided
const DEFAULT_DIR = 'src/components/admin';

// Get the directory to check from command line args or use default
const targetDir = process.argv[2] || DEFAULT_DIR;

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

// Results tracking
const results = {
  totalFiles: 0,
  componentsChecked: 0,
  barrelFilesChecked: 0,
  componentsWithIssues: [],
  barrelFilesWithIssues: [],
  directoryResults: {}
};

/**
 * Check if a file uses both named and default exports
 * @param {string} filePath - Path to the component file
 * @return {Object} - Results of the check
 */
function checkComponentExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for export patterns
    const hasNamedExport = /export\s+(const|function|class|interface|type|enum)\s+(\w+)/.test(content);
    const hasDefaultExport = /export\s+default\s+(\w+)/.test(content);
    
    const result = {
      path: filePath,
      isValid: hasNamedExport && hasDefaultExport,
      hasNamedExport,
      hasDefaultExport,
      issues: []
    };
    
    if (!hasNamedExport) {
      result.issues.push('Missing named export');
    }
    
    if (!hasDefaultExport) {
      result.issues.push('Missing default export');
    }
    
    // Check if the component uses try/catch with exports (which is invalid)
    if (/try\s*\{[^}]*export/.test(content)) {
      result.issues.push('Using export within try/catch block (invalid)');
      result.isValid = false;
    }
    
    return result;
  } catch (error) {
    return {
      path: filePath,
      isValid: false,
      hasNamedExport: false,
      hasDefaultExport: false,
      issues: [`Error reading file: ${error.message}`]
    };
  }
}

/**
 * Check if a barrel file (index.ts) follows the standardized pattern
 * @param {string} filePath - Path to the barrel file
 * @return {Object} - Results of the check
 */
function checkBarrelFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for the standardized barrel file patterns
    const hasStarExports = /export\s+\*\s+from/.test(content);
    const hasNamedDefaultExports = /export\s+{\s*default\s+as\s+\w+\s*}\s+from/.test(content);
    const hasTryCatch = /try\s*\{/.test(content);
    
    const result = {
      path: filePath,
      isValid: hasStarExports && hasNamedDefaultExports && !hasTryCatch,
      issues: []
    };
    
    if (!hasStarExports) {
      result.issues.push('Missing "export * from" pattern');
    }
    
    if (!hasNamedDefaultExports) {
      result.issues.push('Missing "export { default as Component } from" pattern');
    }
    
    if (hasTryCatch) {
      result.issues.push('Contains try/catch blocks (should be removed)');
    }
    
    return result;
  } catch (error) {
    return {
      path: filePath,
      isValid: false,
      issues: [`Error reading file: ${error.message}`]
    };
  }
}

/**
 * Get all TypeScript/JavaScript files in a directory recursively
 * @param {string} dir - Directory to check
 * @param {Array<string>} fileList - Accumulator for results
 * @return {Array<string>} - List of file paths
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fileList = getAllFiles(filePath, fileList);
    } else if (
      file.endsWith('.tsx') || 
      file.endsWith('.ts') || 
      file.endsWith('.jsx') || 
      file.endsWith('.js')
    ) {
      // Skip non-component files like utils, types, etc.
      if (
        !file.includes('.test.') && 
        !file.includes('.spec.') &&
        !file.includes('.d.ts') &&
        !file.includes('types.ts')
      ) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Process and check a directory for export standards
 * @param {string} directory - Directory to process
 */
function processDirectory(directory) {
  console.log(`\n${COLORS.bold}${COLORS.blue}Processing directory: ${directory}${COLORS.reset}\n`);
  
  // Get all files in the directory
  const allFiles = getAllFiles(directory);
  results.totalFiles += allFiles.length;
  
  // Group files by directory for reporting
  const directoryMap = {};
  
  allFiles.forEach(file => {
    const dirname = path.dirname(file);
    if (!directoryMap[dirname]) {
      directoryMap[dirname] = [];
    }
    directoryMap[dirname].push(file);
  });
  
  // Process each directory separately
  Object.keys(directoryMap).forEach(dirname => {
    const dirResults = {
      totalFiles: 0,
      componentsChecked: 0,
      barrelFilesChecked: 0,
      componentsWithIssues: [],
      barrelFilesWithIssues: []
    };
    
    results.directoryResults[dirname] = dirResults;
    
    // Check each file
    directoryMap[dirname].forEach(file => {
      const fileName = path.basename(file);
      dirResults.totalFiles++;
      
      // Check if it's a barrel file (index.ts)
      if (fileName === 'index.ts' || fileName === 'index.js') {
        dirResults.barrelFilesChecked++;
        results.barrelFilesChecked++;
        
        const barrelResult = checkBarrelFile(file);
        if (!barrelResult.isValid) {
          dirResults.barrelFilesWithIssues.push(barrelResult);
          results.barrelFilesWithIssues.push(barrelResult);
        }
      } 
      // Check components
      else if (
        fileName.endsWith('.tsx') || 
        fileName.endsWith('.jsx')
      ) {
        dirResults.componentsChecked++;
        results.componentsChecked++;
        
        const componentResult = checkComponentExports(file);
        if (!componentResult.isValid) {
          dirResults.componentsWithIssues.push(componentResult);
          results.componentsWithIssues.push(componentResult);
        }
      }
    });
  });
}

/**
 * Print results summary to console
 */
function printResults() {
  console.log(`\n${COLORS.bold}${COLORS.magenta}Export Pattern Verification Results${COLORS.reset}\n`);
  
  console.log(`${COLORS.bold}Summary:${COLORS.reset}`);
  console.log(`Total files checked: ${results.totalFiles}`);
  console.log(`Components checked: ${results.componentsChecked}`);
  console.log(`Barrel files checked: ${results.barrelFilesChecked}`);
  
  // Components with issues
  if (results.componentsWithIssues.length > 0) {
    console.log(`\n${COLORS.bold}${COLORS.red}Components with export issues (${results.componentsWithIssues.length}):${COLORS.reset}`);
    
    results.componentsWithIssues.forEach(result => {
      console.log(`\n${COLORS.yellow}${result.path}${COLORS.reset}`);
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    });
  } else {
    console.log(`\n${COLORS.bold}${COLORS.green}All components follow the standardized export pattern.${COLORS.reset}`);
  }
  
  // Barrel files with issues
  if (results.barrelFilesWithIssues.length > 0) {
    console.log(`\n${COLORS.bold}${COLORS.red}Barrel files with export issues (${results.barrelFilesWithIssues.length}):${COLORS.reset}`);
    
    results.barrelFilesWithIssues.forEach(result => {
      console.log(`\n${COLORS.yellow}${result.path}${COLORS.reset}`);
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    });
  } else {
    console.log(`\n${COLORS.bold}${COLORS.green}All barrel files follow the standardized export pattern.${COLORS.reset}`);
  }
  
  // Print result summary
  if (results.componentsWithIssues.length === 0 && results.barrelFilesWithIssues.length === 0) {
    console.log(`\n${COLORS.bold}${COLORS.green}✅ All files follow the standardized export pattern!${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.bold}${COLORS.red}❌ ${results.componentsWithIssues.length + results.barrelFilesWithIssues.length} files need to be updated.${COLORS.reset}`);
    
    console.log(`\n${COLORS.bold}${COLORS.cyan}Recommended fixes:${COLORS.reset}`);
    console.log(`
1. For component files (*.tsx, *.jsx):
   - Add named export: export function/const ComponentName ... { }
   - Add default export: export default ComponentName;

2. For barrel files (index.ts):
   - Use this pattern:
     export * from './ComponentName';
     export { default as ComponentName } from './ComponentName';
   - Remove any try/catch blocks
`);
  }
}

/**
 * Generate report file with detailed analysis
 */
function generateReport() {
  const reportPath = path.join(process.cwd(), 'export-verification-report.md');
  
  let reportContent = `# Export Pattern Verification Report\n\n`;
  reportContent += `Generated on: ${new Date().toISOString()}\n\n`;
  
  reportContent += `## Summary\n\n`;
  reportContent += `- Total files checked: ${results.totalFiles}\n`;
  reportContent += `- Components checked: ${results.componentsChecked}\n`;
  reportContent += `- Barrel files checked: ${results.barrelFilesChecked}\n`;
  reportContent += `- Components with issues: ${results.componentsWithIssues.length}\n`;
  reportContent += `- Barrel files with issues: ${results.barrelFilesWithIssues.length}\n\n`;
  
  // Components with issues
  if (results.componentsWithIssues.length > 0) {
    reportContent += `## Components with Export Issues\n\n`;
    
    results.componentsWithIssues.forEach(result => {
      reportContent += `### ${result.path}\n\n`;
      reportContent += `Issues:\n`;
      result.issues.forEach(issue => {
        reportContent += `- ${issue}\n`;
      });
      reportContent += `\n`;
    });
  }
  
  // Barrel files with issues
  if (results.barrelFilesWithIssues.length > 0) {
    reportContent += `## Barrel Files with Export Issues\n\n`;
    
    results.barrelFilesWithIssues.forEach(result => {
      reportContent += `### ${result.path}\n\n`;
      reportContent += `Issues:\n`;
      result.issues.forEach(issue => {
        reportContent += `- ${issue}\n`;
      });
      reportContent += `\n`;
    });
  }
  
  // Add standardized patterns section
  reportContent += `## Standardized Patterns\n\n`;
  
  reportContent += `### Component Files (*.tsx, *.jsx)\n\n`;
  reportContent += `\`\`\`tsx
// ComponentName.tsx
export function ComponentName(props) {
  // Component implementation
}

// Also export as default for backward compatibility
export default ComponentName;
\`\`\`\n\n`;
  
  reportContent += `### Barrel Files (index.ts)\n\n`;
  reportContent += `\`\`\`tsx
// index.ts
// Export all named exports
export * from './ComponentName';

// Re-export default as named export
export { default as ComponentName } from './ComponentName';

// Optional: Export default for direct imports
export { default } from './ComponentName';
\`\`\`\n\n`;
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n${COLORS.bold}${COLORS.cyan}Report saved to: ${reportPath}${COLORS.reset}\n`);
}

// Execute the verification
try {
  // Check if directory exists
  if (!fs.existsSync(targetDir)) {
    console.error(`${COLORS.red}Directory not found: ${targetDir}${COLORS.reset}`);
    process.exit(1);
  }
  
  // Process the directory
  processDirectory(targetDir);
  
  // Print results
  printResults();
  
  // Generate detailed report
  generateReport();
  
  // Return appropriate exit code
  if (results.componentsWithIssues.length > 0 || results.barrelFilesWithIssues.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (error) {
  console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
  process.exit(1);
}
