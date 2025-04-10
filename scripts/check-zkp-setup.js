/**
 * Check ZKP Setup Script
 * 
 * This script checks if the ZKP authentication system is properly set up.
 * It verifies that all required files exist and are accessible.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Define required files
const requiredFiles = [
  'circuits/zkp_auth/simple_auth.circom',
  'circuits/zkp_auth/poseidon_envelope.circom',
  'circuits/zkp_auth/poseidon_no_pragma.circom',
  'circuits/zkp_auth/poseidon_constants_no_pragma.circom',
  'circuits/zkp_auth/simple_auth_output/simple_auth.r1cs',
  'circuits/zkp_auth/simple_auth_output/simple_auth.sym',
  'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm',
  'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey',
  'circuits/zkp_auth/simple_auth_output/verification_key.json',
  'circuits/zkp_auth/simple_auth_output/verifier.sol',
  'circuits/zkp_auth/simple_auth_output/input.json',
  'circuits/zkp_auth/simple_auth_output/witness.wtns',
  'circuits/zkp_auth/simple_auth_output/proof.json',
  'circuits/zkp_auth/simple_auth_output/public.json',
];

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Main function
function checkZkpSetup() {
  console.log(chalk.blue('Checking ZKP authentication system setup...'));
  console.log();

  // Check if all required files exist
  const missingFiles = [];
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fileExists(filePath)) {
      missingFiles.push(file);
    }
  }

  // Print results
  if (missingFiles.length === 0) {
    console.log(chalk.green('✅ ZKP authentication system is properly set up!'));
    console.log();
    console.log('All required files exist:');
    for (const file of requiredFiles) {
      console.log(chalk.green(`  ✓ ${file}`));
    }
  } else {
    console.log(chalk.red('❌ ZKP authentication system is not properly set up!'));
    console.log();
    console.log('Missing files:');
    for (const file of missingFiles) {
      console.log(chalk.red(`  ✗ ${file}`));
    }
    console.log();
    console.log('Please run the ZKP setup script:');
    console.log(chalk.yellow('  npm run zkp:setup'));
    console.log();
    console.log('For more information, see:');
    console.log(chalk.yellow('  docs/ZKP-SETUP-GUIDE.md'));
  }
}

// Run the main function
checkZkpSetup();
