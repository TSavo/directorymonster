const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Configuration
const PATCHES_DIR = 'testid-fix-patches';
const REPORTS_DIR = 'testid-fix-reports';
const TARGET_COMPONENT = 'SiteHeader';
const TEST_FILE = 'tests/SiteHeader.test.tsx';

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR);
}

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

// Function to run tests for the SiteHeader component
function runSiteHeaderTest() {
  try {
    // Run Jest with the config file
    const result = execSync(`npx jest ${TEST_FILE} --config=jest.config.js --json`, { encoding: 'utf8' });
    const jsonResult = JSON.parse(result);
    return {
      success: jsonResult.numPassedTests,
      fail: jsonResult.numFailedTests,
      total: jsonResult.numTotalTests,
      output: result
    };
  } catch (error) {
    // Jest returns non-zero exit code if tests fail, but we still want the output
    if (error.stdout) {
      try {
        const jsonResult = JSON.parse(error.stdout);
        return {
          success: jsonResult.numPassedTests,
          fail: jsonResult.numFailedTests,
          total: jsonResult.numTotalTests,
          output: error.stdout
        };
      } catch (parseError) {
        console.error(`Error parsing Jest output: ${parseError.message}`);
      }
    }
    
    return {
      success: 0,
      fail: 1,
      total: 1,
      output: error.message
    };
  }
}

// Function to backup a file before changes
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

// Function to revert changes to a file
function revertChanges(filePath) {
  try {
    const backupPath = `${filePath}.backup`;
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath); // Remove the backup file
      console.log(`Successfully reverted changes to ${filePath}`);
      return true;
    } else {
      console.error(`No backup file found for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to revert changes to ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to apply a patch manually
function applyPatch(patchFilePath) {
  console.log(`Applying patch: ${patchFilePath}...`);
  
  try {
    // Extract the target file path from the patch
    const patchContent = readFile(patchFilePath);
    if (!patchContent) {
      console.log(`Failed to read patch file: ${patchFilePath}`);
      return { success: false, targetFile: null };
    }
    
    // Extract the target file path from the patch
    const targetFileMatch = patchContent.match(/^# Patch for (.+)$/m);
    if (!targetFileMatch || !targetFileMatch[1]) {
      console.log(`Failed to extract target file path from patch: ${patchFilePath}`);
      return { success: false, targetFile: null };
    }
    
    const targetFilePath = targetFileMatch[1];
    
    // Check if the target file exists
    if (!fs.existsSync(targetFilePath)) {
      console.log(`Target file does not exist: ${targetFilePath}`);
      return { success: false, targetFile: targetFilePath };
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
    
    // Read the target file
    const targetContent = readFile(targetFilePath);
    if (!targetContent) {
      console.log(`Failed to read target file: ${targetFilePath}`);
      return { success: false, targetFile: targetFilePath };
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
      console.log(`Failed to find the section to replace in ${targetFilePath}`);
      return { success: false, targetFile: targetFilePath };
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
    fs.writeFileSync(targetFilePath, newContent);
    console.log(`Successfully applied patch to ${targetFilePath}`);
    
    return { success: true, targetFile: targetFilePath };
  } catch (error) {
    console.error(`Error applying patch ${patchFilePath}: ${error.message}`);
    return { success: false, targetFile: null };
  }
}

// Function to process a patch file
function processPatchFile(patchFilePath) {
  console.log(`\n=== Processing ${patchFilePath} ===`);
  
  // Find the target file from the patch
  const patchContent = readFile(patchFilePath);
  if (!patchContent) {
    console.log(`Failed to read patch file: ${patchFilePath}`);
    return {
      patchFile: patchFilePath,
      targetFile: null,
      success: false,
      beforeTests: null,
      afterTests: null,
      kept: false,
      reason: 'Failed to read patch file'
    };
  }
  
  const targetFileMatch = patchContent.match(/^# Patch for (.+)$/m);
  if (!targetFileMatch || !targetFileMatch[1]) {
    console.log(`Failed to extract target file path from patch: ${patchFilePath}`);
    return {
      patchFile: patchFilePath,
      targetFile: null,
      success: false,
      beforeTests: null,
      afterTests: null,
      kept: false,
      reason: 'Failed to extract target file path'
    };
  }
  
  const targetFile = targetFileMatch[1];
  
  // Check if the target file exists
  if (!fs.existsSync(targetFile)) {
    console.log(`Target file does not exist: ${targetFile}`);
    return {
      patchFile: patchFilePath,
      targetFile,
      success: false,
      beforeTests: null,
      afterTests: null,
      kept: false,
      reason: 'Target file does not exist'
    };
  }
  
  // Backup the file before making any changes
  backupFile(targetFile);
  
  // Run the tests before applying the patch
  console.log(`Running tests before applying the patch...`);
  const beforeTestsResults = runSiteHeaderTest();
  console.log(`  Success: ${beforeTestsResults.success}/${beforeTestsResults.total}`);
  
  // Apply the patch
  const applyResult = applyPatch(patchFilePath);
  
  if (!applyResult.success) {
    console.log(`Failed to apply patch ${patchFilePath}`);
    return {
      patchFile: patchFilePath,
      targetFile,
      success: false,
      beforeTests: beforeTestsResults,
      afterTests: null,
      kept: false,
      reason: 'Failed to apply patch'
    };
  }
  
  // Run the tests after applying the patch
  console.log(`Running tests after applying the patch...`);
  const afterTestsResults = runSiteHeaderTest();
  console.log(`  Success: ${afterTestsResults.success}/${afterTestsResults.total}`);
  
  // Calculate total success before and after
  const totalSuccessBefore = beforeTestsResults.success;
  const totalSuccessAfter = afterTestsResults.success;
  
  // Decide whether to keep the changes
  let kept = false;
  let reason = '';
  
  if (totalSuccessAfter > totalSuccessBefore) {
    console.log(`Success count increased from ${totalSuccessBefore} to ${totalSuccessAfter}. Keeping changes.`);
    kept = true;
    reason = `Success count increased from ${totalSuccessBefore} to ${totalSuccessAfter}`;
  } else if (totalSuccessAfter === totalSuccessBefore) {
    console.log(`Success count unchanged (${totalSuccessBefore}). Reverting changes.`);
    revertChanges(targetFile);
    reason = `Success count unchanged (${totalSuccessBefore})`;
  } else {
    console.log(`Success count decreased from ${totalSuccessBefore} to ${totalSuccessAfter}. Reverting changes.`);
    revertChanges(targetFile);
    reason = `Success count decreased from ${totalSuccessBefore} to ${totalSuccessAfter}`;
  }
  
  return {
    patchFile: patchFilePath,
    targetFile,
    success: true,
    beforeTests: beforeTestsResults,
    afterTests: afterTestsResults,
    kept,
    reason
  };
}

// Function to generate a report for a patch
function generateReport(result) {
  const { patchFile, targetFile, success, beforeTests, afterTests, kept, reason } = result;
  
  let report = `# Test Report for ${path.basename(patchFile)}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Patch File**: ${patchFile}\n`;
  report += `- **Target File**: ${targetFile}\n`;
  report += `- **Patch Applied**: ${success ? 'Yes' : 'No'}\n`;
  report += `- **Changes Kept**: ${kept ? 'Yes' : 'No'}\n`;
  report += `- **Reason**: ${reason}\n\n`;
  
  if (beforeTests && afterTests) {
    report += `## Test Results\n\n`;
    report += `### Before Patch\n\n`;
    report += `- **Total Tests**: ${beforeTests.total}\n`;
    report += `- **Passed**: ${beforeTests.success}\n`;
    report += `- **Failed**: ${beforeTests.fail}\n\n`;
    
    report += `### After Patch\n\n`;
    report += `- **Total Tests**: ${afterTests.total}\n`;
    report += `- **Passed**: ${afterTests.success}\n`;
    report += `- **Failed**: ${afterTests.fail}\n\n`;
    
    report += `### Detailed Results\n\n`;
    report += `#### ${TEST_FILE}\n\n`;
    report += `- **Before**: ${beforeTests.success}/${beforeTests.total} passed\n`;
    report += `- **After**: ${afterTests.success}/${afterTests.total} passed\n`;
    report += `- **Difference**: ${afterTests.success - beforeTests.success} more passing tests\n\n`;
  }
  
  // Add the patch content
  const patchContent = readFile(patchFile);
  if (patchContent) {
    report += `## Patch Content\n\n`;
    report += `\`\`\`diff\n${patchContent}\n\`\`\`\n`;
  }
  
  return report;
}

// Main function
function main() {
  // Get all patch files for the SiteHeader component
  if (!fs.existsSync(PATCHES_DIR)) {
    console.error(`Patches directory ${PATCHES_DIR} does not exist. Run the pipeline first.`);
    return;
  }
  
  const patchFiles = fs.readdirSync(PATCHES_DIR)
    .filter(file => file.startsWith(TARGET_COMPONENT) && file.endsWith('.patch'))
    .map(file => path.join(PATCHES_DIR, file));
  
  console.log(`Found ${patchFiles.length} patch files for ${TARGET_COMPONENT}`);
  
  // Process each patch file
  const results = [];
  
  for (const patchFile of patchFiles) {
    const result = processPatchFile(patchFile);
    results.push(result);
    
    // Generate and save the report
    const report = generateReport(result);
    const reportFile = path.join(REPORTS_DIR, `${path.basename(patchFile, '.patch')}-report.md`);
    writeFile(reportFile, report);
    console.log(`Saved report to ${reportFile}`);
  }
  
  // Generate a summary report
  let summaryReport = `# Test Results Summary for ${TARGET_COMPONENT}\n\n`;
  summaryReport += `## Overview\n\n`;
  summaryReport += `- **Total Patches**: ${results.length}\n`;
  summaryReport += `- **Successfully Applied**: ${results.filter(r => r.success).length}\n`;
  summaryReport += `- **Changes Kept**: ${results.filter(r => r.kept).length}\n\n`;
  
  summaryReport += `## Patches\n\n`;
  results.forEach((result, index) => {
    summaryReport += `### ${index + 1}. ${path.basename(result.patchFile)}\n\n`;
    summaryReport += `- **Target**: ${result.targetFile || 'Unknown'}\n`;
    summaryReport += `- **Applied**: ${result.success ? 'Yes' : 'No'}\n`;
    summaryReport += `- **Kept**: ${result.kept ? 'Yes' : 'No'}\n`;
    summaryReport += `- **Reason**: ${result.reason}\n\n`;
  });
  
  const summaryReportFile = path.join(REPORTS_DIR, `${TARGET_COMPONENT}-summary-report.md`);
  writeFile(summaryReportFile, summaryReport);
  console.log(`\nSaved summary report to ${summaryReportFile}`);
  
  console.log(`\n=== All Done ===`);
  console.log(`Applied ${results.filter(r => r.kept).length} out of ${results.length} patches`);
  console.log(`Check the ${REPORTS_DIR} directory for detailed reports`);
}

// Start the process
main();
