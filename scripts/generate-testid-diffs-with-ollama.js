const fs = require('fs');
const path = require('path');

// Configuration
const OLLAMA_MODEL = 'deepseek-r1:7b'; // Using deepseek-r1:7b model
const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OUTPUT_DIR = 'testid-fix-diffs';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
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

// Function to pull the Ollama model
async function pullOllamaModel() {
  try {
    console.log(`Pulling model ${OLLAMA_MODEL}...`);
    const response = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: OLLAMA_MODEL,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`Successfully pulled model ${OLLAMA_MODEL}`);
    return true;
  } catch (error) {
    console.error(`Error pulling Ollama model: ${error.message}`);
    console.log('Continuing anyway, as the model might already be available...');
    return false;
  }
}

// Function to call Ollama API
async function callOllama(prompt) {
  try {
    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error(`Error calling Ollama: ${error.message}`);
    return null;
  }
}



// Function to generate a diff using Ollama
async function generateDiff(suggestion) {
  const { testFile, missingTestIds, componentFiles } = suggestion;

  if (!testFile || !componentFiles || componentFiles.length === 0) {
    console.log(`Skipping ${testFile || 'unknown file'} due to missing component files`);
    return null;
  }

  console.log(`Generating diff for ${testFile} with ${missingTestIds.length} missing test IDs`);

  // Read the test file
  const testContent = readFile(testFile);
  if (!testContent) return null;

  // Read the component files
  const componentContents = [];
  for (const componentFile of componentFiles) {
    const content = readFile(componentFile);
    if (content) {
      componentContents.push({ file: componentFile, content });
    }
  }

  if (componentContents.length === 0) {
    console.log(`No component files found or readable for ${testFile}`);
    return null;
  }

  // Prepare prompt for Ollama
  const prompt = `
I need you to generate a diff to fix mismatched data-testid attributes between a React component and its test file.

TEST FILE (${testFile}):
\`\`\`tsx
${testContent}
\`\`\`

COMPONENT FILE(S):
${componentContents.map(({ file, content }) => `
FILE: ${file}
\`\`\`tsx
${content}
\`\`\`
`).join('\n')}

The test is looking for these data-testid attributes that don't exist in the component:
${missingTestIds.map(id => `- ${id}`).join('\n')}

Please generate a diff that fixes this issue by either:
1. Adding the missing data-testid attributes to the component (preferred approach)
2. Updating the test to use existing data-testid attributes in the component
3. If the test is using mocks, updating the mocks to provide the correct data-testid attributes

You MUST output your solution in proper unified diff format like this example:

\`\`\`diff
--- a/src/components/example.tsx
+++ b/src/components/example.tsx
@@ -10,7 +10,7 @@ function Example() {
   return (
     <div>
-      <button onClick={handleClick}>
+      <button onClick={handleClick} data-testid="example-button">
         Click me
       </button>
     </div>
\`\`\`

Do not include any other format or explanations outside of the diff blocks. Only output valid diff syntax that could be directly applied with git apply or patch commands. Include proper file paths, line numbers, and context lines.

Focus on the most minimal changes needed to fix the issue. If you need to add data-testid attributes to the component, try to identify the correct elements based on the test's expectations.
`;

  console.log(`Calling Ollama for ${testFile}...`);
  const diffResponse = await callOllama(prompt);

  if (!diffResponse) {
    console.log(`Failed to get diff from Ollama for ${testFile}`);
    return null;
  }

  return {
    testFile,
    componentFiles: componentFiles.map(f => f),
    missingTestIds,
    diff: diffResponse
  };
}

// Main function
async function main() {
  // Pull the Ollama model first
  await pullOllamaModel();

  // Read the mismatched test IDs file
  const mismatchedTestIdsFile = 'mismatched-testids.json';

  if (!fs.existsSync(mismatchedTestIdsFile)) {
    console.error(`File ${mismatchedTestIdsFile} not found. Please run find-mismatched-testids.js first.`);
    return;
  }

  const mismatchedData = JSON.parse(fs.readFileSync(mismatchedTestIdsFile, 'utf8'));
  console.log(`Found ${mismatchedData.length} mismatched test files`);

  // Process all files with component files (skip those with errors)
  const filesToProcess = mismatchedData.filter(item => !item.error && item.componentFiles && item.componentFiles.length > 0);
  console.log(`Processing ${filesToProcess.length} files with component files`);

  // Process each file
  for (let i = 0; i < filesToProcess.length; i++) {
    const item = filesToProcess[i];
    console.log(`Processing ${i+1}/${filesToProcess.length}: ${item.testFile}`);

    const suggestion = {
      testFile: item.testFile,
      componentFiles: item.componentFiles,
      missingTestIds: item.missingTestIds
    };
    // No need to check if suggestion is null since we're creating it directly

    // Skip suggestions with no component files
    if (!suggestion.componentFiles || suggestion.componentFiles.length === 0) {
      console.log(`Skipping ${suggestion.testFile || 'unknown file'} due to missing component files`);
      continue;
    }

    const diffResult = await generateDiff(suggestion);
    if (!diffResult) {
      console.log(`Failed to generate diff for ${suggestion.testFile}`);
      continue;
    }

    // Save the diff to a file
    const outputFile = path.join(OUTPUT_DIR, `${path.basename(item.testFile, '.tsx').replace(/\.test$/, '')}-diff.md`);
    const outputContent = `# Diff for ${diffResult.testFile}

## Missing data-testid attributes
${diffResult.missingTestIds.map(id => `- \`${id}\``).join('\n')}

## Component Files
${diffResult.componentFiles.map(file => `- ${file}`).join('\n')}

## Generated Diff
${diffResult.diff}

## IMPORTANT: Manual Review Required
This diff is a suggestion only. Please review it carefully before applying any changes.
To apply these changes:
1. Review each file change to ensure it makes sense
2. Apply the changes manually or use a patch tool
3. Run the tests to verify the changes fixed the issue

DO NOT apply these changes automatically without review.
`;
    writeFile(outputFile, outputContent);

    console.log(`Saved diff to ${outputFile}`);
  }

  console.log('\nAll done!');
  console.log(`Check the ${OUTPUT_DIR} directory for the diffs.`);
  console.log('\nIMPORTANT: These diffs are suggestions only. Please review them carefully before applying any changes.');
}

// Start the process
main().catch(console.error);
