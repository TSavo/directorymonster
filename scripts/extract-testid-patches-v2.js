const fs = require('fs');
const path = require('path');

// Configuration
const DIFFS_DIR = 'testid-fix-diffs';
const PATCHES_DIR = 'testid-fix-patches';

// Create patches directory if it doesn't exist
if (!fs.existsSync(PATCHES_DIR)) {
  fs.mkdirSync(PATCHES_DIR);
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

// Function to extract diff content from a diff file
function extractDiff(diffContent) {
  // Find the start of the diff section
  const diffStartIndex = diffContent.indexOf('## Generated Diff');
  if (diffStartIndex === -1) {
    return null;
  }

  // Find the end of the diff section (start of the next section)
  const nextSectionIndex = diffContent.indexOf('## IMPORTANT:', diffStartIndex);
  if (nextSectionIndex === -1) {
    return null;
  }

  // Extract the diff content
  let diffText = diffContent.substring(diffStartIndex + '## Generated Diff'.length, nextSectionIndex).trim();

  // Remove any <think> blocks that might be present
  const thinkStartIndex = diffText.indexOf('<think>');
  if (thinkStartIndex !== -1) {
    const thinkEndIndex = diffText.indexOf('</think>', thinkStartIndex);
    if (thinkEndIndex !== -1) {
      diffText = diffText.substring(0, thinkStartIndex) + diffText.substring(thinkEndIndex + '</think>'.length);
    }
  }

  // Clean up the diff text
  diffText = diffText.trim();

  // Extract file paths and diff content
  const patches = [];
  
  // Look for diff blocks
  const diffBlockRegex = /```diff[\s\S]*?```/g;
  const diffBlocks = diffText.match(diffBlockRegex);
  
  if (diffBlocks && diffBlocks.length > 0) {
    // Process each diff block
    for (const block of diffBlocks) {
      const cleanBlock = block.replace(/```diff\n?/, '').replace(/```\n?$/, '');
      
      // Try to extract file paths from the diff
      const filePathMatch = cleanBlock.match(/^(?:---|\+\+\+) [ab]\/(.+)$/m);
      if (filePathMatch && filePathMatch[1]) {
        const filePath = filePathMatch[1];
        patches.push({
          filePath,
          diff: cleanBlock
        });
      } else {
        // If no file path found in the diff, look for FILE: lines before the diff
        const fileLineRegex = /FILE: (.+?)[\r\n]/;
        const fileLineMatch = diffText.match(fileLineRegex);
        if (fileLineMatch && fileLineMatch[1]) {
          const filePath = fileLineMatch[1];
          patches.push({
            filePath,
            diff: cleanBlock
          });
        }
      }
    }
  }
  
  // Look for custom diff format with FILE: and SEARCH/REPLACE blocks
  const customBlockRegex = /FILE: (.+?)[\r\n]```(?:typescript|jsx)?[\s\S]*?<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE[\s\S]*?```/g;
  let customBlockMatch;
  
  while ((customBlockMatch = customBlockRegex.exec(diffText)) !== null) {
    const filePath = customBlockMatch[1];
    const customBlock = customBlockMatch[0];
    
    // Extract the search and replace sections
    const searchStartIndex = customBlock.indexOf('<<<<<<< SEARCH') + '<<<<<<< SEARCH'.length;
    const searchEndIndex = customBlock.indexOf('=======', searchStartIndex);
    const replaceStartIndex = customBlock.indexOf('=======', searchStartIndex) + '======='.length;
    const replaceEndIndex = customBlock.indexOf('>>>>>>> REPLACE', replaceStartIndex);
    
    if (searchStartIndex !== -1 && searchEndIndex !== -1 && replaceStartIndex !== -1 && replaceEndIndex !== -1) {
      const searchText = customBlock.substring(searchStartIndex, searchEndIndex).trim();
      const replaceText = customBlock.substring(replaceStartIndex, replaceEndIndex).trim();
      
      // Count the number of lines in the search text to create a realistic diff
      const searchLines = searchText.split('\n').length;
      
      // Create a unified diff format
      const diff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${searchLines} +1,${replaceText.split('\n').length} @@\n-${searchText.split('\n').join('\n-')}\n+${replaceText.split('\n').join('\n+')}\n`;
      
      patches.push({
        filePath,
        diff
      });
    }
  }
  
  return patches;
}

// Function to process a diff file and create patch files
function processDiffFile(diffFilePath) {
  console.log(`Processing ${diffFilePath}...`);
  
  const diffContent = readFile(diffFilePath);
  if (!diffContent) {
    console.log(`Failed to read diff file: ${diffFilePath}`);
    return false;
  }
  
  const patches = extractDiff(diffContent);
  if (!patches || patches.length === 0) {
    console.log(`No valid diff content found in ${diffFilePath}`);
    return false;
  }
  
  // Create a patch file for each patch
  for (let i = 0; i < patches.length; i++) {
    const { filePath, diff } = patches[i];
    
    // Create a patch file name based on the original file name
    const baseName = path.basename(diffFilePath, path.extname(diffFilePath));
    const patchFileName = `${baseName}-${i+1}.patch`;
    const patchFilePath = path.join(PATCHES_DIR, patchFileName);
    
    // Write the patch file
    const patchContent = `# Patch for ${filePath}\n\n${diff}`;
    if (writeFile(patchFilePath, patchContent)) {
      console.log(`Created patch file: ${patchFilePath}`);
    } else {
      console.log(`Failed to create patch file: ${patchFilePath}`);
    }
  }
  
  return true;
}

// Main function
function main() {
  // Get all diff files
  const diffFiles = fs.readdirSync(DIFFS_DIR)
    .filter(file => file.endsWith('-diff.md'))
    .map(file => path.join(DIFFS_DIR, file));
  
  console.log(`Found ${diffFiles.length} diff files`);
  
  // Process each diff file
  let successCount = 0;
  for (const diffFile of diffFiles) {
    if (processDiffFile(diffFile)) {
      successCount++;
    }
  }
  
  console.log(`\nProcessed ${successCount} out of ${diffFiles.length} diff files`);
  console.log(`\nTo apply a patch, use: git apply ${PATCHES_DIR}/patch-file.patch`);
  console.log(`Or: patch -p1 < ${PATCHES_DIR}/patch-file.patch`);
  console.log(`\nIMPORTANT: Review each patch carefully before applying!`);
}

// Start the process
main();
