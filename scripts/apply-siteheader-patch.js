const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PATCH_FILE = 'testid-fix-patches/SiteHeader-fixed.patch';
const TARGET_FILE = 'src/components/SiteHeader.tsx';
const TEST_FILE = 'tests/SiteHeader.test.tsx';
const REPORT_FILE = 'siteheader-test-report.md';

// Function to read a file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return null;
  }
}

// Function to write to a file
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing to file ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to backup a file
function backupFile(filePath) {
  try {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Successfully backed up ${filePath} to ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to backup ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to restore a file from backup
function restoreFile(filePath) {
  try {
    const backupPath = `${filePath}.backup`;
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
      console.log(`Successfully restored ${filePath} from backup`);
      return true;
    } else {
      console.error(`No backup file found for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to restore ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to apply a patch
function applyPatch(patchFilePath, targetFilePath) {
  console.log(`Applying patch ${patchFilePath} to ${targetFilePath}...`);
  
  try {
    // Read the patch file
    const patchContent = readFile(patchFilePath);
    if (!patchContent) {
      console.error(`Failed to read patch file: ${patchFilePath}`);
      return false;
    }
    
    // Read the target file
    const targetContent = readFile(targetFilePath);
    if (!targetContent) {
      console.error(`Failed to read target file: ${targetFilePath}`);
      return false;
    }
    
    // Parse the patch to extract the changes
    const diffLines = patchContent.split('\n');
    let inHunk = false;
    let hunkStart = 0;
    let hunkEnd = 0;
    let addedLines = [];
    let removedLines = [];
    
    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      
      if (line.startsWith('@@')) {
        // Parse the hunk header
        const hunkMatch = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
        if (hunkMatch) {
          inHunk = true;
          hunkStart = parseInt(hunkMatch[1]);
          hunkEnd = hunkStart + parseInt(hunkMatch[2]) - 1;
          addedLines = [];
          removedLines = [];
        }
      } else if (inHunk) {
        if (line.startsWith('+')) {
          // Added line
          addedLines.push(line.substring(1));
        } else if (line.startsWith('-')) {
          // Removed line
          removedLines.push(line.substring(1));
        }
      }
    }
    
    // Apply the changes manually
    const targetLines = targetContent.split('\n');
    let newContent = '';
    
    // Find the section to replace
    let foundSection = false;
    let sectionStart = 0;
    let sectionEnd = 0;
    
    for (let i = 0; i <= targetLines.length - removedLines.length; i++) {
      let match = true;
      for (let j = 0; j < removedLines.length; j++) {
        if (targetLines[i + j] !== removedLines[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        foundSection = true;
        sectionStart = i;
        sectionEnd = i + removedLines.length - 1;
        break;
      }
    }
    
    if (!foundSection) {
      console.error(`Failed to find the section to replace in ${targetFilePath}`);
      return false;
    }
    
    // Create the new content
    for (let i = 0; i < sectionStart; i++) {
      newContent += targetLines[i] + '\n';
    }
    
    for (let i = 0; i < addedLines.length; i++) {
      newContent += addedLines[i] + '\n';
    }
    
    for (let i = sectionEnd + 1; i < targetLines.length; i++) {
      newContent += targetLines[i] + (i < targetLines.length - 1 ? '\n' : '');
    }
    
    // Write the new content to the file
    writeFile(targetFilePath, newContent);
    console.log(`Successfully applied patch to ${targetFilePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error applying patch: ${error.message}`);
    return false;
  }
}

// Function to run tests
function runTests(testFile) {
  console.log(`Running tests for ${testFile}...`);
  
  try {
    // Run Jest with the config file
    const output = execSync(`cd .. && npx jest ${testFile} --config=jest.config.js`, { encoding: 'utf8' });
    console.log(output);
    
    // Parse the output to get the test results
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const totalMatch = output.match(/(\d+) total/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    return {
      passed,
      failed,
      total,
      output
    };
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    
    // Parse the output to get the test results
    const passedMatch = error.stdout?.match(/(\d+) passed/);
    const failedMatch = error.stdout?.match(/(\d+) failed/);
    const totalMatch = error.stdout?.match(/(\d+) total/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    return {
      passed,
      failed,
      total,
      output: error.stdout || error.message
    };
  }
}

// Function to generate a report
function generateReport(beforeResults, afterResults, kept) {
  let report = `# SiteHeader Test Report\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Patch Applied**: Yes\n`;
  report += `- **Changes Kept**: ${kept ? 'Yes' : 'No'}\n`;
  report += `- **Reason**: ${kept ? 'Test success count increased' : 'Test success count did not increase'}\n\n`;
  
  report += `## Test Results\n\n`;
  report += `### Before Patch\n\n`;
  report += `- **Total Tests**: ${beforeResults.total}\n`;
  report += `- **Passed**: ${beforeResults.passed}\n`;
  report += `- **Failed**: ${beforeResults.failed}\n\n`;
  
  report += `### After Patch\n\n`;
  report += `- **Total Tests**: ${afterResults.total}\n`;
  report += `- **Passed**: ${afterResults.passed}\n`;
  report += `- **Failed**: ${afterResults.failed}\n\n`;
  
  report += `### Difference\n\n`;
  report += `- **Passed**: ${afterResults.passed - beforeResults.passed} more passing tests\n`;
  report += `- **Failed**: ${afterResults.failed - beforeResults.failed} more failing tests\n\n`;
  
  report += `## Patch Content\n\n`;
  report += `\`\`\`diff\n${readFile(PATCH_FILE)}\n\`\`\`\n`;
  
  return report;
}

// Main function
function main() {
  console.log(`Starting SiteHeader patch test...`);
  
  // Check if the patch file exists
  if (!fs.existsSync(PATCH_FILE)) {
    console.error(`Patch file ${PATCH_FILE} does not exist`);
    return;
  }
  
  // Check if the target file exists
  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`Target file ${TARGET_FILE} does not exist`);
    return;
  }
  
  // Backup the target file
  backupFile(TARGET_FILE);
  
  // Run tests before applying the patch
  console.log(`\n=== Running tests before applying the patch ===`);
  const beforeResults = runTests(TEST_FILE);
  
  // Apply the patch
  console.log(`\n=== Applying the patch ===`);
  const patchApplied = applyPatch(PATCH_FILE, TARGET_FILE);
  
  if (!patchApplied) {
    console.error(`Failed to apply patch`);
    restoreFile(TARGET_FILE);
    return;
  }
  
  // Run tests after applying the patch
  console.log(`\n=== Running tests after applying the patch ===`);
  const afterResults = runTests(TEST_FILE);
  
  // Decide whether to keep the changes
  const kept = afterResults.passed > beforeResults.passed;
  
  if (kept) {
    console.log(`\n=== Test success count increased from ${beforeResults.passed} to ${afterResults.passed}. Keeping changes. ===`);
  } else {
    console.log(`\n=== Test success count did not increase. Reverting changes. ===`);
    restoreFile(TARGET_FILE);
  }
  
  // Generate and save the report
  const report = generateReport(beforeResults, afterResults, kept);
  writeFile(REPORT_FILE, report);
  console.log(`\nSaved report to ${REPORT_FILE}`);
  
  console.log(`\n=== All Done ===`);
}

// Start the process
main();
