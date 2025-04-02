const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of components that are now default exports
const defaultExportComponents = [
  'SEOStep',
  'AdminHeader',
  'AdminSidebar',
  'ListingTable',
  'BasicInfoStep',
  'DomainStep',
  'FormActions',
  'StepNavigation',
  'SiteForm',
  'ZKPLogin',
  'ListingForm'
];

// Function to recursively find all test files
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to check if a file contains named imports of our components
function checkImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for named imports of our components
    for (const component of defaultExportComponents) {
      // This regex handles various formats of named imports including multi-line and with aliases
      const namedImportRegex = new RegExp(`import\\s+{[^}]*\\b${component}\\b[^}]*}\\s+from\\s+['"]([^'"]+)['"]`, 'g');
      const matches = [...content.matchAll(namedImportRegex)];
      
      if (matches.length > 0) {
        matches.forEach(match => {
          // Check if this is a barrel import (from index file)
          const isBarrelImport = !match[1].endsWith(component);
          
          issues.push({
            type: 'named-import',
            component,
            importPath: match[1],
            fullMatch: match[0],
            line: content.substring(0, match.index).split('\n').length,
            isBarrelImport
          });
        });
      }
    }
    
    // Check for deep relative paths (../../../)
    const deepRelativeRegex = /import\s+(?:{[^}]*}|[^;]*)\s+from\s+['"](\.\.\/.+?)['"];/g;
    const deepMatches = [...content.matchAll(deepRelativeRegex)];
    
    if (deepMatches.length > 0) {
      deepMatches.forEach(match => {
        const importPath = match[1];
        // Only fix paths with multiple levels of ../
        if (importPath.startsWith('../..')) {
          issues.push({
            type: 'deep-relative',
            importPath,
            fullMatch: match[0],
            line: content.substring(0, match.index).split('\n').length
          });
        }
      });
    }
    
    return { filePath, issues };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { filePath, issues: [] };
  }
}

// Function to convert a deep relative path to an absolute path
function convertToAbsolutePath(filePath, relativePath) {
  // Get the directory of the file
  const fileDir = path.dirname(filePath);
  
  // Resolve the relative path to an absolute path
  const absolutePath = path.resolve(fileDir, relativePath);
  
  // Get the path relative to the project root
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  
  // Check if the path is within the src directory
  if (absolutePath.startsWith(srcDir)) {
    // Convert to @/ format
    const relativeSrcPath = path.relative(srcDir, absolutePath);
    return '@/' + relativeSrcPath.replace(/\\/g, '/');
  }
  
  // If not in src, return the original path
  return relativePath;
}

// Function to fix the imports in a file (dry run)
function fixImports(fileInfo, dryRun = true) {
  if (fileInfo.issues.length === 0) return null;
  
  let content = fs.readFileSync(fileInfo.filePath, 'utf8');
  const changes = [];
  
  for (const issue of fileInfo.issues) {
    if (issue.type === 'named-import') {
      const { component, importPath, fullMatch, isBarrelImport } = issue;
      
      // Create the new import statement
      let newImportPath = importPath;
      
      // If it's a barrel import, we need to update the path to point directly to the component file
      if (isBarrelImport) {
        // Handle different import patterns
        if (importPath.endsWith('/components')) {
          newImportPath = `${importPath}/${component}`;
        } else if (importPath.endsWith('/auth')) {
          newImportPath = `${importPath}/${component}`;
        } else if (importPath.endsWith('/layout')) {
          newImportPath = `${importPath}/${component}`;
        }
      }
      
      const newImport = `import ${component} from '${newImportPath}'`;
      
      // For dry run, just record the change
      changes.push({
        file: fileInfo.filePath,
        line: issue.line,
        oldImport: fullMatch,
        newImport,
        isBarrelImport,
        type: 'named-import'
      });
      
      // If not a dry run, actually make the change
      if (!dryRun) {
        content = content.replace(fullMatch, newImport);
      }
    } else if (issue.type === 'deep-relative') {
      const { importPath, fullMatch } = issue;
      
      // Convert the deep relative path to an absolute path
      const absolutePath = convertToAbsolutePath(fileInfo.filePath, importPath);
      
      // Create the new import statement by replacing the relative path with the absolute path
      const newImport = fullMatch.replace(`'${importPath}'`, `'${absolutePath}'`).replace(`"${importPath}"`, `"${absolutePath}"`);
      
      // For dry run, just record the change
      changes.push({
        file: fileInfo.filePath,
        line: issue.line,
        oldImport: fullMatch,
        newImport,
        type: 'deep-relative'
      });
      
      // If not a dry run, actually make the change
      if (!dryRun) {
        content = content.replace(fullMatch, newImport);
      }
    }
  }
  
  // If not a dry run, write the changes back to the file
  if (!dryRun) {
    fs.writeFileSync(fileInfo.filePath, content, 'utf8');
  }
  
  return changes;
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);
  
  // Find all test files
  const testDir = path.join(process.cwd(), 'tests');
  const testFiles = findTestFiles(testDir);
  console.log(`Found ${testFiles.length} test files`);
  
  // Check each file for import issues
  const filesWithIssues = [];
  let totalIssues = 0;
  
  testFiles.forEach(file => {
    const fileInfo = checkImports(file);
    if (fileInfo.issues.length > 0) {
      filesWithIssues.push(fileInfo);
      totalIssues += fileInfo.issues.length;
    }
  });
  
  console.log(`Found ${totalIssues} import issues in ${filesWithIssues.length} files`);
  
  // Fix the issues (or just report them in dry run mode)
  const allChanges = [];
  
  filesWithIssues.forEach(fileInfo => {
    const changes = fixImports(fileInfo, dryRun);
    if (changes) {
      allChanges.push(...changes);
    }
  });
  
  // Print the changes
  console.log('\nChanges to be made:');
  allChanges.forEach(change => {
    console.log(`\nFile: ${change.file}`);
    console.log(`Line: ${change.line}`);
    console.log(`- ${change.oldImport}`);
    console.log(`+ ${change.newImport}`);
    if (change.type === 'named-import' && change.isBarrelImport) {
      console.log(`Note: This is a barrel import that will be updated to point directly to the component file.`);
    } else if (change.type === 'deep-relative') {
      console.log(`Note: Converting deep relative path to absolute path.`);
    }
  });
  
  return { filesWithIssues, allChanges };
}

// Run the script in dry run mode
const result = main(true);

// Export the result for potential use in other scripts
module.exports = { result, main };
