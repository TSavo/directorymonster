/**
 * Script to update package.json with API E2E test scripts
 */

const fs = require('fs');
const path = require('path');

// Read the current package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add the new test scripts
packageJson.scripts['test:e2e:api'] = 'jest --config=jest-configs/jest.api-e2e.config.js';
packageJson.scripts['test:e2e:api:watch'] = 'jest --config=jest-configs/jest.api-e2e.config.js --watch