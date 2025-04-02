const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PATCHES_DIR = 'testid-fix-patches';

// Function to read a file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return null;
  }
}

// Function to apply a patch
function applyPatch(patchFilePath) {
  console.log(`Applying patch: ${patchFilePath}...`);
  
  try {
    // Extract the target file path from the patch
    const patchContent = readFile(patchFilePath);
    if (!patchContent) {
      console.log(`Failed to read patch file: ${patchFilePath}`);
      return false;
    }
    
    // Extract the target file path from the patch
    const targetFileMatch = patchContent.match(/^# Patch for (.+)$/m);
    if (!targetFileMatch || !targetFileMatch[1]) {
      console.log(`Failed to extract target file path from patch: ${patchFilePath}`);
      return false;
    }
    
    const targetFilePath = targetFileMatch[1];
    
    // Check if the target file exists
    if (!fs.existsSync(targetFilePath)) {
      console.log(`Target file does not exist: ${targetFilePath}`);
      return false;
    }
    
    // Apply the patch using git apply
    try {
      execSync(`git apply --check ${patchFilePath}`, { stdio: 'pipe' });
      execSync(`git apply ${patchFilePath}`, { stdio: 'pipe' });
      console.log(`Successfully applied patch to ${targetFilePath}`);
      return true;
    } catch (error) {
      console.error(`Failed to apply patch to ${targetFilePath}: ${error.message}`);
      
      // Try using patch command as a fallback
      try {
        execSync(`patch -p1 < ${patchFilePath}`, { stdio: 'pipe' });
        console.log(`Successfully applied patch to ${targetFilePath} using patch command`);
        return true;
      } catch (patchError) {
        console.error(`Failed to apply patch using patch command: ${patchError.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error applying patch ${patchFilePath}: ${error.message}`);
    return false;
  }
}

// Function to apply all patches
function applyAllPatches() {
  // Get all patch files
  const patchFiles = fs.readdirSync(PATCHES_DIR)
    .filter(file => file.endsWith('.patch'))
    .map(file => path.join(PATCHES_DIR, file));
  
  console.log(`Found ${patchFiles.length} patch files`);
  
  // Apply each patch
  let successCount = 0;
  for (const patchFile of patchFiles) {
    if (applyPatch(patchFile)) {
      successCount++;
    }
  }
  
  console.log(`\nApplied ${successCount} out of ${patchFiles.length} patches`);
}

// Function to apply a specific patch
function applySpecificPatch(patchFileName) {
  const patchFilePath = path.join(PATCHES_DIR, patchFileName);
  
  if (!fs.existsSync(patchFilePath)) {
    console.log(`Patch file does not exist: ${patchFilePath}`);
    return;
  }
  
  if (applyPatch(patchFilePath)) {
    console.log(`Successfully applied patch: ${patchFilePath}`);
  } else {
    console.log(`Failed to apply patch: ${patchFilePath}`);
  }
}

// Main function
function main() {
  // Check if a specific patch file was specified
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const patchFileName = args[0];
    applySpecificPatch(patchFileName);
  } else {
    // Display a warning and ask for confirmation
    console.log('WARNING: This script will apply all patches in the testid-fix-patches directory.');
    console.log('It is recommended to review each patch carefully before applying.');
    console.log('To apply a specific patch, use: node scripts/apply-testid-patches.js patch-file.patch');
    console.log('\nTo apply all patches, press Enter. To cancel, press Ctrl+C.');
    
    // Wait for user input
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('', () => {
      readline.close();
      applyAllPatches();
    });
  }
}

// Start the process
main();
