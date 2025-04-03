const fs = require('fs');
const { execSync } = require('child_process');

// Read the issues from the JSON file
const issues = JSON.parse(fs.readFileSync('submit-api-issues.json', 'utf8'));

// Function to create an issue with a delay
function createIssueWithDelay(issue, index) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`Creating issue ${index + 1}/${issues.length}: ${issue.title}`);

      // Create a temporary file for the issue body
      const tempFile = `temp-issue-body-${index}.md`;
      fs.writeFileSync(tempFile, issue.body);

      try {
        // Create the issue using GitHub CLI
        execSync(`gh issue create --title "${issue.title}" --body-file "${tempFile}"`, { stdio: 'inherit' });
        console.log(`Successfully created issue: ${issue.title}`);
        resolve();
      } catch (error) {
        console.error(`Failed to create issue: ${issue.title}`);
        console.error(error);
        reject(error);
      } finally {
        // Clean up the temporary file
        fs.unlinkSync(tempFile);
      }
    }, index * 2000); // 2 second delay between issues
  });
}

// Create all issues sequentially
async function createAllIssues() {
  try {
    for (let i = 0; i < issues.length; i++) {
      await createIssueWithDelay(issues[i], i);
    }
    console.log('All issues created successfully!');
  } catch (error) {
    console.error('Failed to create all issues:', error);
  }
}

// Start creating issues
createAllIssues();
