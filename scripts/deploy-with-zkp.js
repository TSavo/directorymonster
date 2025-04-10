/**
 * Deploy with ZKP Script
 * 
 * This script deploys the application with the ZKP authentication system.
 * It checks if the ZKP authentication system is properly set up and sets it up if needed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Execute a command
function executeCommand(command, description) {
  try {
    console.log(chalk.blue(`Executing: ${command}`));
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(chalk.red(`Error ${description}:`), error);
    return false;
  }
}

// Check if the ZKP authentication system is properly set up
function isZkpSetupComplete() {
  const requiredFiles = [
    'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm',
    'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey',
    'circuits/zkp_auth/simple_auth_output/verification_key.json',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fileExists(filePath)) {
      return false;
    }
  }

  return true;
}

// Main function
async function deployWithZkp() {
  console.log(chalk.blue('Deploying application with ZKP authentication system...'));
  console.log();

  // Step 1: Check if the ZKP authentication system is properly set up
  if (!isZkpSetupComplete()) {
    console.log(chalk.yellow('ZKP authentication system is not properly set up. Setting it up now...'));
    console.log();

    // Set up the ZKP authentication system
    if (process.platform === 'win32') {
      if (!executeCommand('npm run win:zkp:setup', 'setting up ZKP authentication system')) {
        console.error(chalk.red('Failed to set up ZKP authentication system. Aborting deployment.'));
        process.exit(1);
      }
    } else {
      if (!executeCommand('npm run zkp:setup', 'setting up ZKP authentication system')) {
        console.error(chalk.red('Failed to set up ZKP authentication system. Aborting deployment.'));
        process.exit(1);
      }
    }
  } else {
    console.log(chalk.green('ZKP authentication system is properly set up.'));
    console.log();
  }

  // Step 2: Build the application
  console.log(chalk.blue('Building the application...'));
  console.log();
  if (!executeCommand('npm run build', 'building the application')) {
    console.error(chalk.red('Failed to build the application. Aborting deployment.'));
    process.exit(1);
  }

  // Step 3: Deploy the application
  console.log(chalk.blue('Deploying the application...'));
  console.log();
  if (!executeCommand('npm run start', 'deploying the application')) {
    console.error(chalk.red('Failed to deploy the application.'));
    process.exit(1);
  }

  console.log(chalk.green('Application deployed successfully with ZKP authentication system!'));
}

// Run the main function
deployWithZkp().catch(error => {
  console.error(chalk.red('Deployment failed:'), error);
  process.exit(1);
});
