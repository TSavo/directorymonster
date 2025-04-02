const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common component import patterns
const importPatterns = {
  // Default import: import Component from '@/path/to/Component';
  defaultImport: /import\s+([A-Za-z0-9_]+)\s+from\s+['"](@\/[^'"]+)['"];/g,
  
  // Named import: import { Component } from '@/path/to/Component';
  namedImport: /import\s+{\s*([A-Za-z0-9_]+)(?:\s+as\s+([A-Za-z0-9_]+))?\s*}\s+from\s+['"](@\/[^'"]+)['"];/g,
  
  // Mixed import: import Component, { SubComponent } from '@/path/to/Component';
  mixedImport: /import\s+([A-Za-z0-9_]+),\s*{\s*([A-Za-z0-9_,\s]+)\s*}\s+from\s+['"](@\/[^'"]+)['"];/g
};

// Common component export patterns
const exportPatterns = {
  // Default export: export default Component;
  defaultExport: /export\s+default\s+([A-Za-z0-9_]+);/g,
  
  // Named export: export const Component = ...
  namedExport: /export\s+const\s+([A-Za-z0-9_]+)\s*=/g,
  
  // Default function export: export default function Component() { ... }
  defaultFunctionExport: /export\s+default\s+function\s+([A-Za-z0-9_]+)/g,
  
  // Named function export: export function Component() { ... }
  namedFunctionExport: /export\s+function\s+([A-Za-z0-9_]+)/g
};

// Map of component paths to their export types
const componentExportMap = new Map();

// Function to recursively find all source files
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git') {
        findSourceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to analyze component exports
function analyzeComponentExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, '');
    
    // Check for default exports
    let hasDefaultExport = false;
    let defaultExportName = null;
    
    // Check for default export
    const defaultExportMatches = [...content.matchAll(exportPatterns.defaultExport)];
    if (defaultExportMatches.length > 0) {
      hasDefaultExport = true;
      defaultExportName = defaultExportMatches[0][1];
    }
    
    // Check for default function export
    const defaultFunctionExportMatches = [...content.matchAll(exportPatterns.defaultFunctionExport)];
    if (defaultFunctionExportMatches.length > 0) {
      hasDefaultExport = true;
      defaultExportName = defaultFunctionExportMatches[0][1];
    }
    
    // Check for named exports
    const namedExports = [];
    
    // Check for named export constants
    const namedExportMatches = [...content.matchAll(exportPatterns.namedExport)];
    namedExportMatches.forEach(match => {
      namedExports.push(match[1]);
    });
    
    // Check for named export functions
    const namedFunctionExportMatches = [...content.matchAll(exportPatterns.namedFunctionExport)];
    namedFunctionExportMatches.forEach(match => {
      namedExports.push(match[1]);
    });
    
    // Store the export information
    componentExportMap.set(relativePath, {
      hasDefaultExport,
      defaultExportName,
      namedExports,
      importPath: relativePath.replace(/\.(tsx|ts|jsx|js)$/, '')
    });
    
  } catch (error) {
    console.error(`Error analyzing exports in ${filePath}:`, error);
  }
}

// Function to check and fix component imports
function fixComponentImports(filePath, dryRun = true) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const changes = [];
    
    // Check default imports
    const defaultImportMatches = [...content.matchAll(importPatterns.defaultImport)];
    defaultImportMatches.forEach(match => {
      const componentName = match[1];
      const importPath = match[2].substring(2); // Remove @/ prefix
      
      // Find the actual file path
      const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
      let actualFilePath = null;
      
      for (const ext of possibleExtensions) {
        const fullPath = path.join('src', importPath + ext);
        if (fs.existsSync(fullPath)) {
          actualFilePath = fullPath.replace(/\\/g, '/');
          break;
        }
      }
      
      if (actualFilePath && componentExportMap.has(actualFilePath)) {
        const exportInfo = componentExportMap.get(actualFilePath);
        
        // If the component doesn't have a default export but is imported as default
        if (!exportInfo.hasDefaultExport && exportInfo.namedExports.includes(componentName)) {
          const oldImport = match[0];
          const newImport = `import { ${componentName} } from '${match[2]}';`;
          
          changes.push({
            type: 'default-to-named',
            file: filePath,
            component: componentName,
            oldImport,
            newImport
          });
          
          if (!dryRun) {
            content = content.replace(oldImport, newImport);
          }
        }
      }
    });
    
    // Check named imports
    const namedImportMatches = [...content.matchAll(importPatterns.namedImport)];
    namedImportMatches.forEach(match => {
      const componentName = match[1];
      const importPath = match[3].substring(2); // Remove @/ prefix
      
      // Find the actual file path
      const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
      let actualFilePath = null;
      
      for (const ext of possibleExtensions) {
        const fullPath = path.join('src', importPath + ext);
        if (fs.existsSync(fullPath)) {
          actualFilePath = fullPath.replace(/\\/g, '/');
          break;
        }
      }
      
      if (actualFilePath && componentExportMap.has(actualFilePath)) {
        const exportInfo = componentExportMap.get(actualFilePath);
        
        // If the component has a default export but is imported as named
        if (exportInfo.hasDefaultExport && exportInfo.defaultExportName === componentName && !exportInfo.namedExports.includes(componentName)) {
          const oldImport = match[0];
          const newImport = `import ${componentName} from '${match[3]}';`;
          
          changes.push({
            type: 'named-to-default',
            file: filePath,
            component: componentName,
            oldImport,
            newImport
          });
          
          if (!dryRun) {
            content = content.replace(oldImport, newImport);
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
    console.error(`Error fixing imports in ${filePath}:`, error);
    return [];
  }
}

// Function to fix missing exports
function fixMissingExports(filePath, dryRun = true) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const changes = [];
    
    // Check if this is a component file (contains React and exports a component)
    if (content.includes('import React') || content.includes('from "react"') || content.includes('from \'react\'')) {
      // Check if the file has a named export but no default export
      const exportInfo = componentExportMap.get(filePath.replace(/\\/g, '/').replace(/^\//, ''));
      
      if (exportInfo && !exportInfo.hasDefaultExport && exportInfo.namedExports.length > 0) {
        // Get the main component name (usually the same as the file name)
        const fileName = path.basename(filePath, path.extname(filePath));
        const mainComponentName = exportInfo.namedExports.find(name => name.toLowerCase() === fileName.toLowerCase()) || exportInfo.namedExports[0];
        
        // Add a default export for the main component
        const exportStatement = `\n\n// Added default export for compatibility\nexport default ${mainComponentName};\n`;
        
        changes.push({
          type: 'add-default-export',
          file: filePath,
          component: mainComponentName,
          exportStatement
        });
        
        if (!dryRun) {
          content += exportStatement;
          fs.writeFileSync(filePath, content, 'utf8');
        }
      }
    }
    
    return changes;
  } catch (error) {
    console.error(`Error fixing exports in ${filePath}:`, error);
    return [];
  }
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);
  
  // Find all source files
  const srcDir = path.join(process.cwd(), 'src');
  const sourceFiles = findSourceFiles(srcDir);
  console.log(`Found ${sourceFiles.length} source files`);
  
  // Analyze component exports
  sourceFiles.forEach(file => {
    analyzeComponentExports(file);
  });
  console.log(`Analyzed exports for ${componentExportMap.size} components`);
  
  // Fix component imports
  const importChanges = [];
  sourceFiles.forEach(file => {
    const changes = fixComponentImports(file, dryRun);
    importChanges.push(...changes);
  });
  console.log(`Found ${importChanges.length} import issues to fix`);
  
  // Fix missing exports
  const exportChanges = [];
  sourceFiles.forEach(file => {
    const changes = fixMissingExports(file, dryRun);
    exportChanges.push(...changes);
  });
  console.log(`Found ${exportChanges.length} export issues to fix`);
  
  // Print the changes
  console.log('\nImport changes to be made:');
  importChanges.forEach((change, index) => {
    console.log(`\n${index + 1}. File: ${change.file}`);
    console.log(`Component: ${change.component}`);
    console.log(`Type: ${change.type}`);
    console.log(`- ${change.oldImport}`);
    console.log(`+ ${change.newImport}`);
  });
  
  console.log('\nExport changes to be made:');
  exportChanges.forEach((change, index) => {
    console.log(`\n${index + 1}. File: ${change.file}`);
    console.log(`Component: ${change.component}`);
    console.log(`Type: ${change.type}`);
    console.log(`+ ${change.exportStatement.trim()}`);
  });
  
  return { importChanges, exportChanges };
}

// Run the script in dry run mode
const result = main(true);

// Export the result for potential use in other scripts
module.exports = { result, main };
