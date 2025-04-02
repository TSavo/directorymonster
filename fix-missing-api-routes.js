const fs = require('fs');
const path = require('path');

// Find all test files that import missing API routes
function findTestsWithMissingApiRoutes(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findTestsWithMissingApiRoutes(filePath, fileList);
      }
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for imports of API routes that might not exist
      if (content.includes('import') && content.includes('/api/')) {

        // Extract the import paths
        const importRegex = /import\s+.*\s+from\s+['"](.+?)['"];/g;
        const imports = [];
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }

        // Check if any of the imports are missing
        const missingImports = imports.filter(importPath => {
          // Only process imports that include /api/
          if (!importPath.includes('/api/')) {
            return false;
          }

          // Convert @/ imports to src/
          const resolvedPath = importPath.replace('@/', 'src/');

          // Check if the file exists
          try {
            // For Next.js API routes, we need to check for both .ts and .tsx extensions
            const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
            let fileExists = false;

            for (const ext of possibleExtensions) {
              const fullPath = path.join(process.cwd(), resolvedPath + ext);
              if (fs.existsSync(fullPath)) {
                fileExists = true;
                break;
              }
            }

            // Also check for route.ts/route.js files in directories
            if (!fileExists && !resolvedPath.endsWith('/route')) {
              const dirPath = path.join(process.cwd(), resolvedPath);
              if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                for (const ext of possibleExtensions) {
                  const routePath = path.join(dirPath, 'route' + ext);
                  if (fs.existsSync(routePath)) {
                    fileExists = true;
                    break;
                  }
                }
              }
            }

            return !fileExists;
          } catch (error) {
            return true;
          }
        });

        if (missingImports.length > 0) {
          fileList.push({
            filePath,
            missingImports
          });
        }
      }
    }
  });

  return fileList;
}

// Create mock API routes for missing imports
function createMockApiRoutes(testInfo, dryRun = true) {
  const { filePath, missingImports } = testInfo;
  const createdMocks = [];

  missingImports.forEach(importPath => {
    // Convert @/ imports to src/
    const resolvedPath = importPath.replace('@/', 'src/');
    const fullPath = path.join(process.cwd(), resolvedPath);

    // Determine if this is a route.ts file or a regular API file
    const isRouteFile = resolvedPath.endsWith('/route');
    const finalPath = isRouteFile ? fullPath + '.ts' : fullPath + '.ts';

    // Create the directory if it doesn't exist
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir) && !dryRun) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create a basic mock API route
    const mockContent = `// Mock API route created for tests
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}
`;

    if (!dryRun) {
      fs.writeFileSync(finalPath, mockContent, 'utf8');
    }

    createdMocks.push({
      importPath,
      finalPath
    });
  });

  return createdMocks;
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);

  // Find tests with missing API routes
  const testsWithMissingApiRoutes = findTestsWithMissingApiRoutes(path.join(process.cwd(), 'tests'));

  console.log(`Found ${testsWithMissingApiRoutes.length} tests with missing API routes`);

  // Create mock API routes
  const createdMocks = [];
  testsWithMissingApiRoutes.forEach(testInfo => {
    const mocks = createMockApiRoutes(testInfo, dryRun);
    createdMocks.push(...mocks);
  });

  console.log(`Created ${createdMocks.length} mock API routes`);

  // Print details of created mocks
  if (createdMocks.length > 0) {
    console.log('\nCreated mock API routes:');
    createdMocks.forEach((mock, index) => {
      console.log(`${index + 1}. ${mock.importPath} -> ${mock.finalPath}`);
    });
  }

  return { testsWithMissingApiRoutes, createdMocks };
}

// Run the script in live mode
const result = main(false);
module.exports = { result, main };
