const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const OLLAMA_MODEL = 'llama3'; // Change to your preferred model
const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';

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

// Function to analyze a test file and its component
async function analyzeTestAndComponent(testFile, componentFiles) {
  console.log(`\nAnalyzing test file: ${testFile}`);
  
  const testContent = readFile(testFile);
  if (!testContent) return null;
  
  let componentContents = [];
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
  
  // Extract data-testid from test file
  const testIdRegex = /(?:getByTestId|queryByTestId|findByTestId|getAllByTestId|queryAllByTestId|findAllByTestId)\\([\"']([^\"']+)[\"']\\)/g;
  const testIds = new Set();
  let match;
  while ((match = testIdRegex.exec(testContent)) !== null) {
    testIds.add(match[1]);
  }
  
  // Extract data-testid from component files
  const componentTestIds = new Set();
  const dataTestIdRegex = /data-testid=[\"']([^\"']+)[\"']/g;
  
  for (const { content } of componentContents) {
    while ((match = dataTestIdRegex.exec(content)) !== null) {
      componentTestIds.add(match[1]);
    }
  }
  
  // Find missing test IDs
  const missingTestIds = Array.from(testIds).filter(id => !componentTestIds.has(id));
  
  if (missingTestIds.length === 0) {
    console.log(`No missing test IDs found for ${testFile}`);
    return null;
  }
  
  console.log(`Found ${missingTestIds.length} missing test IDs in ${testFile}`);
  
  // Prepare prompt for Ollama
  const prompt = `
I need help fixing mismatched data-testid attributes between a React component and its test file.

TEST FILE:
\`\`\`
${testContent}
\`\`\`

COMPONENT FILE(S):
${componentContents.map(({ file, content }) => `
File: ${file}
\`\`\`
${content}
\`\`\`
`).join('\n')}

The test is looking for these data-testid attributes that don't exist in the component:
${missingTestIds.join(', ')}

Please suggest one of the following solutions:
1. Update the component to include the missing data-testid attributes (provide the exact code changes)
2. Update the test to use existing data-testid attributes in the component (provide the exact code changes)
3. If the test is using mocks, suggest how to update the mocks to provide the correct data-testid attributes

Provide your answer in a structured format with clear code snippets that can be directly applied.
`;

  console.log('Calling Ollama for analysis...');
  const analysis = await callOllama(prompt);
  
  if (!analysis) {
    console.log('Failed to get analysis from Ollama');
    return null;
  }
  
  return {
    testFile,
    componentFiles: componentFiles.map(f => f),
    missingTestIds,
    analysis
  };
}

// Main function
async function main() {
  // Read the mismatched test IDs file
  const mismatchedTestIdsFile = 'mismatched-testids.json';
  
  if (!fs.existsSync(mismatchedTestIdsFile)) {
    console.error(`File ${mismatchedTestIdsFile} not found. Please run find-mismatched-testids.js first.`);
    return;
  }
  
  const mismatchedData = JSON.parse(fs.readFileSync(mismatchedTestIdsFile, 'utf8'));
  
  // Process each test file
  const results = [];
  
  for (let i = 0; i < Math.min(mismatchedData.length, 5); i++) { // Limit to 5 files for testing
    const item = mismatchedData[i];
    
    if (item.error) {
      console.log(`Skipping ${item.testFile} due to error: ${item.error}`);
      continue;
    }
    
    const result = await analyzeTestAndComponent(item.testFile, item.componentFiles);
    if (result) {
      results.push(result);
      
      // Save the analysis to a file
      const outputFile = `${path.basename(item.testFile, path.extname(item.testFile))}-analysis.md`;
      writeFile(outputFile, `# Analysis for ${item.testFile}\n\n${result.analysis}`);
      console.log(`Analysis saved to ${outputFile}`);
    }
  }
  
  console.log('\nAnalysis complete!');
  console.log(`Processed ${results.length} files with mismatched test IDs`);
}

// Save the mismatched test IDs to a file first
function saveMismatchedTestIds() {
  // Run the find-mismatched-testids.js script and capture its output
  exec('node scripts/find-mismatched-testids.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running find-mismatched-testids.js: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`find-mismatched-testids.js stderr: ${stderr}`);
    }
    
    // Parse the output to extract the mismatched test IDs
    const lines = stdout.split('\n');
    const mismatchedData = [];
    
    let currentItem = null;
    
    for (const line of lines) {
      if (line.includes('Test file:')) {
        if (currentItem) {
          mismatchedData.push(currentItem);
        }
        
        currentItem = {
          testFile: line.split('Test file:')[1].trim(),
          componentFiles: [],
          missingTestIds: []
        };
      } else if (line.includes('Error:') && currentItem) {
        currentItem.error = line.split('Error:')[1].trim();
      } else if (line.includes('Component files:') && currentItem) {
        // Next lines will be component files
        continue;
      } else if (line.includes('Missing test IDs:') && currentItem) {
        // Next lines will be missing test IDs
        continue;
      } else if (line.trim().startsWith('- ') && currentItem) {
        if (line.includes('.tsx') || line.includes('.jsx') || line.includes('.ts') || line.includes('.js')) {
          currentItem.componentFiles.push(line.trim().substring(2));
        } else {
          currentItem.missingTestIds.push(line.trim().substring(2));
        }
      }
    }
    
    if (currentItem) {
      mismatchedData.push(currentItem);
    }
    
    // Save the data to a file
    fs.writeFileSync('mismatched-testids.json', JSON.stringify(mismatchedData, null, 2));
    console.log(`Saved ${mismatchedData.length} mismatched test IDs to mismatched-testids.json`);
    
    // Now run the main function
    main().catch(console.error);
  });
}

// Start the process
saveMismatchedTestIds();
