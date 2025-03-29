const fs = require('fs');

// Read the log file and print the last N lines
function readLogFile(filePath, numLines = 100, skipLines = 0) {
  try {
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');
    
    // Split into lines
    const lines = data.split('\n');
    
    // Skip lines if specified
    const startIndex = skipLines;
    
    // Calculate end index
    const endIndex = Math.min(startIndex + numLines, lines.length);
    
    // Print the lines with line numbers
    console.log(`Showing lines ${startIndex} to ${endIndex - 1} of ${lines.length} total lines\n`);
    
    for (let i = startIndex; i < endIndex; i++) {
      console.log(`${i}: ${lines[i]}`);
    }
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node read-log.js <file-path> [num-lines] [skip-lines]');
  process.exit(1);
}

const filePath = args[0];
const numLines = args[1] ? parseInt(args[1]) : 100;
const skipLines = args[2] ? parseInt(args[2]) : 0;

readLogFile(filePath, numLines, skipLines);
