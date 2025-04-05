#!/usr/bin/env node

/**
 * Script to check if the current Node.js version meets the requirements.
 * This script is used by other scripts to ensure compatibility.
 */

const REQUIRED_NODE_VERSION = 14;

function checkNodeVersion() {
  const currentVersion = process.versions.node;
  const majorVersion = parseInt(currentVersion.split('.')[0], 10);
  
  if (majorVersion < REQUIRED_NODE_VERSION) {
    console.error('\x1b[31m%s\x1b[0m', `Error: Node.js version ${currentVersion} is not supported.`);
    console.error('\x1b[31m%s\x1b[0m', `DirectoryMonster requires Node.js version ${REQUIRED_NODE_VERSION}.x or higher.`);
    console.error('\x1b[33m%s\x1b[0m', `Please upgrade your Node.js installation: https://nodejs.org/`);
    
    // Exit with error code
    process.exit(1);
  }
  
  // If running with --verbose flag, show success message
  if (process.argv.includes('--verbose')) {
    console.log('\x1b[32m%s\x1b[0m', `Node.js version ${currentVersion} meets requirements (>= ${REQUIRED_NODE_VERSION}.x).`);
  }
  
  return true;
}

// If this script is run directly, check the version
if (require.main === module) {
  checkNodeVersion();
}

// Export the function for use in other scripts
module.exports = checkNodeVersion;
