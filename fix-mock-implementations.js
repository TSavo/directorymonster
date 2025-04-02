const fs = require('fs');
const path = require('path');

// Find all test files with mock implementation issues
function findTestsWithMockIssues(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findTestsWithMockIssues(filePath, fileList);
      }
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for mock implementation issues
      if (content.includes('mockReset') ||
          content.includes('mockResolvedValue') ||
          content.includes('mockImplementation') ||
          content.includes('mockReturnValue')) {

        // Extract the mock calls
        const mockResetRegex = /\(?([^)]+)\)?\.mockReset\(\)/g;
        const mockResolvedValueRegex = /\(?([^)]+)\)?\.mockResolvedValue\(/g;
        const mockImplementationRegex = /\(?([^)]+)\)?\.mockImplementation\(/g;
        const mockReturnValueRegex = /\(?([^)]+)\)?\.mockReturnValue\(/g;

        const mockCalls = [];
        let match;

        while ((match = mockResetRegex.exec(content)) !== null) {
          mockCalls.push({
            type: 'mockReset',
            variable: match[1].trim(),
            fullMatch: match[0]
          });
        }

        while ((match = mockResolvedValueRegex.exec(content)) !== null) {
          mockCalls.push({
            type: 'mockResolvedValue',
            variable: match[1].trim(),
            fullMatch: match[0]
          });
        }

        while ((match = mockImplementationRegex.exec(content)) !== null) {
          mockCalls.push({
            type: 'mockImplementation',
            variable: match[1].trim(),
            fullMatch: match[0]
          });
        }

        while ((match = mockReturnValueRegex.exec(content)) !== null) {
          mockCalls.push({
            type: 'mockReturnValue',
            variable: match[1].trim(),
            fullMatch: match[0]
          });
        }

        if (mockCalls.length > 0) {
          fileList.push({
            filePath,
            mockCalls
          });
        }
      }
    }
  });

  return fileList;
}

// Fix mock implementation issues
function fixMockImplementationIssues(testInfo, dryRun = true) {
  const { filePath, mockCalls } = testInfo;
  let content = fs.readFileSync(filePath, 'utf8');
  const fixes = [];

  // Find the import statements
  const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([^;]+)|([^;{]+))\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const namedImports = match[1] ? match[1].split(',').map(item => item.trim()) : [];
    const namespaceImport = match[2] ? match[2].trim() : null;
    const defaultImport = match[3] ? match[3].trim() : null;
    const importPath = match[4];

    imports.push({
      namedImports,
      namespaceImport,
      defaultImport,
      path: importPath,
      fullMatch: match[0]
    });
  }

  // Get unique variables that need to be mocked
  const uniqueVariables = [...new Set(mockCalls.map(call => call.variable))];

  // Add jest.mock statements for each variable
  uniqueVariables.forEach(variable => {
    // Skip variables that are already jest.fn()
    if (variable.includes('jest.fn()') || variable.includes('jest.fn(')) {
      return;
    }

    // Skip variables that are already mocked
    if (content.includes(`${variable} = jest.fn()`)) {
      return;
    }

    // Find the import for this variable
    let importInfo = null;

    for (const imp of imports) {
      // Check named imports
      if (imp.namedImports.some(item => {
        const parts = item.split(' as ');
        return parts[parts.length - 1].trim() === variable;
      })) {
        importInfo = imp;
        break;
      }

      // Check namespace import
      if (imp.namespaceImport && variable.startsWith(imp.namespaceImport + '.')) {
        importInfo = imp;
        break;
      }

      // Check default import
      if (imp.defaultImport && imp.defaultImport === variable) {
        importInfo = imp;
        break;
      }
    }

    if (importInfo) {
      // Check if there's already a jest.mock for this import
      const mockRegex = new RegExp(`jest\\.mock\\(['"]${importInfo.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);

      if (!mockRegex.test(content)) {
        // Add a jest.mock statement
        let mockStatement;

        if (importInfo.namedImports.includes(variable)) {
          // Named import
          mockStatement = `
// Mock for ${importInfo.path}
jest.mock('${importInfo.path}', () => ({
  __esModule: true,
  ${variable}: jest.fn()
}));
`;
        } else if (importInfo.defaultImport === variable) {
          // Default import
          mockStatement = `
// Mock for ${importInfo.path}
jest.mock('${importInfo.path}', () => ({
  __esModule: true,
  default: jest.fn()
}));
`;
        } else if (importInfo.namespaceImport && variable.startsWith(importInfo.namespaceImport + '.')) {
          // Namespace import
          const nestedProperty = variable.substring(importInfo.namespaceImport.length + 1);
          mockStatement = `
// Mock for ${importInfo.path}
jest.mock('${importInfo.path}', () => ({
  __esModule: true,
  ${nestedProperty}: jest.fn()
}));
`;
        }

        if (mockStatement) {
          // Insert after the last import
          const lastImportIndex = content.lastIndexOf('import ');
          const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;

          const newContent = content.slice(0, lastImportEndIndex) +
                            mockStatement +
                            content.slice(lastImportEndIndex);

          content = newContent;

          fixes.push({
            type: 'add-jest-mock',
            importPath: importInfo.path,
            variable
          });
        }
      }
    } else {
      // If we can't find an import, add a direct mock
      const beforeDescribeIndex = content.indexOf('describe(');
      const beforeTestIndex = content.indexOf('it(');
      const insertIndex = Math.min(
        beforeDescribeIndex !== -1 ? beforeDescribeIndex : Infinity,
        beforeTestIndex !== -1 ? beforeTestIndex : Infinity
      );

      if (insertIndex !== Infinity) {
        const mockStatement = `
// Mock for ${variable}
const ${variable} = jest.fn();
`;

        const newContent = content.slice(0, insertIndex) +
                          mockStatement +
                          content.slice(insertIndex);

        content = newContent;

        fixes.push({
          type: 'add-direct-mock',
          variable
        });
      }
    }
  });

  if (fixes.length > 0 && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return fixes;
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);

  // Find tests with mock implementation issues
  const testsWithMockIssues = findTestsWithMockIssues(path.join(process.cwd(), 'tests'));

  console.log(`Found ${testsWithMockIssues.length} tests with mock implementation issues`);

  // Fix mock implementation issues
  const fixes = [];
  testsWithMockIssues.forEach(testInfo => {
    const testFixes = fixMockImplementationIssues(testInfo, dryRun);
    if (testFixes.length > 0) {
      fixes.push({
        file: testInfo.filePath,
        fixes: testFixes
      });
    }
  });

  console.log(`Applied ${fixes.reduce((sum, item) => sum + item.fixes.length, 0)} fixes to ${fixes.length} files`);

  // Print details of fixes
  if (fixes.length > 0) {
    console.log('\nFixes applied:');
    fixes.forEach((fileFixInfo, index) => {
      console.log(`\n${index + 1}. File: ${fileFixInfo.file}`);
      fileFixInfo.fixes.forEach(fix => {
        if (fix.type === 'add-jest-mock') {
          console.log(`   - Added jest.mock for ${fix.variable} from ${fix.importPath}`);
        } else if (fix.type === 'add-direct-mock') {
          console.log(`   - Added direct mock for ${fix.variable}`);
        }
      });
    });
  }

  return { testsWithMockIssues, fixes };
}

// Run the script in live mode
const result = main(false);
module.exports = { result, main };
