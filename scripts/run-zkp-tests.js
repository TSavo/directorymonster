/**
 * Script to run ZKP tests with different configurations
 * 
 * This script provides a way to run ZKP tests with either mock implementations
 * or real implementations, and can be used to verify that both approaches work.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

/**
 * Run a command and return its output
 * @param {string} command - The command to run
 * @param {boolean} silent - Whether to suppress console output
 * @returns {string} The command output
 */
function runCommand(command, silent = false) {
  try {
    if (!silent) {
      console.log(`${colors.fg.cyan}Running command:${colors.reset} ${command}`);
    }
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    
    return output;
  } catch (error) {
    console.error(`${colors.fg.red}Error running command:${colors.reset} ${command}`);
    console.error(error.message);
    return error.message;
  }
}

/**
 * Check if the required circuit files exist
 * @returns {boolean} Whether all required files exist
 */
function checkCircuitFiles() {
  const requiredFiles = [
    'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm',
    'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey',
    'circuits/zkp_auth/simple_auth_output/verification_key.json'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
  
  if (missingFiles.length > 0) {
    console.log(`${colors.fg.yellow}Missing circuit files:${colors.reset}`);
    missingFiles.forEach(file => console.log(`  - ${file}`));
    return false;
  }
  
  return true;
}

/**
 * Run the ZKP tests with mocks
 */
function runZkpTestsWithMocks() {
  console.log(`\n${colors.fg.green}${colors.bright}Running ZKP tests with mocks${colors.reset}\n`);
  runCommand('npm run test:zkp');
}

/**
 * Run the ZKP tests with real implementations
 */
function runZkpTestsWithRealImplementation() {
  console.log(`\n${colors.fg.green}${colors.bright}Running ZKP tests with real implementations${colors.reset}\n`);
  
  // Check if circuit files exist
  if (!checkCircuitFiles()) {
    console.log(`\n${colors.fg.yellow}Circuit files are missing. Running ZKP setup...${colors.reset}\n`);
    runCommand('npm run zkp:setup');
    
    // Check again after setup
    if (!checkCircuitFiles()) {
      console.error(`\n${colors.fg.red}Failed to generate circuit files. Cannot run tests with real implementations.${colors.reset}\n`);
      return;
    }
  }
  
  runCommand('npm run test:zkp:real');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  console.log(`\n${colors.fg.cyan}${colors.bright}ZKP Test Runner${colors.reset}\n`);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node run-zkp-tests.js [options]

Options:
  --mocks, -m     Run tests with mock implementations only
  --real, -r      Run tests with real implementations only
  --all, -a       Run tests with both mock and real implementations (default)
  --help, -h      Show this help message
    `);
    return;
  }
  
  if (args.includes('--mocks') || args.includes('-m')) {
    runZkpTestsWithMocks();
  } else if (args.includes('--real') || args.includes('-r')) {
    runZkpTestsWithRealImplementation();
  } else {
    // Default: run both
    runZkpTestsWithMocks();
    runZkpTestsWithRealImplementation();
  }
}

// Run the main function
main();
