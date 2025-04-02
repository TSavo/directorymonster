const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Function to check if a file contains deep relative paths
function checkRelativePaths(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for deep relative paths (../../../)
    const deepRelativeRegex = /import\s+(?:{[^}]*}|[^;]*)\s+from\s+['"](\.\.\/.+?)['"];/g;
    const deepMatches = [...content.matchAll(deepRelativeRegex)];
    
    if (deepMatches.length > 0) {
      deepMatches.forEach(match => {
        const importPath = match[1];
        // Only fix paths with multiple levels of ../
        if (importPath.startsWith('../..')) {
          issues.push({
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

// Function to fix the relative paths in a file
function fixRelativePaths(fileInfo, dryRun = true) {
  if (fileInfo.issues.length === 0) return null;
  
  let content = fs.readFileSync(fileInfo.filePath, 'utf8');
  const changes = [];
  
  for (const issue of fileInfo.issues) {
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
      newImport
    });
    
    // If not a dry run, actually make the change
    if (!dryRun) {
      content = content.replace(fullMatch, newImport);
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
  
  // Check each file for relative path issues
  const filesWithIssues = [];
  let totalIssues = 0;
  
  testFiles.forEach(file => {
    const fileInfo = checkRelativePaths(file);
    if (fileInfo.issues.length > 0) {
      filesWithIssues.push(fileInfo);
      totalIssues += fileInfo.issues.length;
    }
  });
  
  console.log(`Found ${totalIssues} relative path issues in ${filesWithIssues.length} files`);
  
  // Fix the issues (or just report them in dry run mode)
  const allChanges = [];
  
  filesWithIssues.forEach(fileInfo => {
    const changes = fixRelativePaths(fileInfo, dryRun);
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
  });
  
  return { filesWithIssues, allChanges };
}

// Run the script in live mode
const result = main(false);

// Export the result for potential use in other scripts
module.exports = { result, main };
