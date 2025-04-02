const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SUGGESTIONS_DIR = 'testid-fix-suggestions';
const DIFFS_DIR = 'testid-fix-diffs';
const PATCHES_DIR = 'testid-fix-patches';

// Create directories if they don't exist
for (const dir of [SUGGESTIONS_DIR, DIFFS_DIR, PATCHES_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Created directory: ${dir}`);
  }
}

// Function to run a command and log its output
function runCommand(command, description) {
  console.log(`\n=== ${description} ===`);
  console.log(`Running: ${command}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Error running command: ${error.message}`);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting testid fix pipeline...');
  
  // Step 1: Find mismatched testids
  console.log('\nStep 1: Finding mismatched data-testid attributes...');
  if (!runCommand('node scripts/find-mismatched-testids.js', 'Find Mismatched TestIDs')) {
    console.error('Failed to find mismatched testids. Aborting pipeline.');
    return;
  }
  
  // Step 2: Generate diffs using Ollama
  console.log('\nStep 2: Generating diffs using Ollama...');
  if (!runCommand('node scripts/generate-testid-diffs-with-ollama.js', 'Generate Diffs')) {
    console.error('Failed to generate diffs. Aborting pipeline.');
    return;
  }
  
  // Step 3: Extract patches from diffs
  console.log('\nStep 3: Extracting patches from diffs...');
  if (!runCommand('node scripts/extract-testid-patches-v2.js', 'Extract Patches')) {
    console.error('Failed to extract patches. Aborting pipeline.');
    return;
  }
  
  // Count the number of patch files
  const patchFiles = fs.readdirSync(PATCHES_DIR).filter(file => file.endsWith('.patch'));
  
  console.log('\n=== Pipeline Complete ===');
  console.log(`Generated ${patchFiles.length} patch files in the ${PATCHES_DIR} directory.`);
  console.log('\nTo apply a specific patch:');
  console.log('  node scripts/apply-testid-patches.js patch-file.patch');
  console.log('\nTo apply all patches (with confirmation):');
  console.log('  node scripts/apply-testid-patches.js');
  console.log('\nIMPORTANT: Review each patch carefully before applying!');
}

// Start the process
main().catch(console.error);
