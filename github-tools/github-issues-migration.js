#!/usr/bin/env node

/**
 * GitHub Issues Migration Script
 * 
 * This script helps extract tasks from NEXTSTEPS.md and prepares them
 * for migration to GitHub Issues with meaningful labels.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NEXTSTEPS_FILE = path.join(__dirname, 'NEXTSTEPS.md');
const OUTPUT_DIR = path.join(__dirname, 'github-issues');
const CHECKPOINT_FILE = path.join(__dirname, 'checkpoint.md');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Function to categorize a task and assign appropriate labels
function categorizeTask(title, section, body) {
  const labels = ['task'];
  
  // Add area labels based on content analysis
  if (/test|testing|jest|unit test|e2e|component test|integration test/i.test(title + section + body)) {
    labels.push('area:testing');
    
    if (/unit test/i.test(title + section + body)) {
      labels.push('test:unit');
    }
    if (/e2e|end-to-end/i.test(title + section + body)) {
      labels.push('test:e2e');
    }
    if (/component test/i.test(title + section + body)) {
      labels.push('test:component');
    }
    if (/integration test/i.test(title + section + body)) {
      labels.push('test:integration');
    }
  }
  
  if (/ui|component|button|input|select|interface|form/i.test(title + section + body)) {
    labels.push('area:ui');
  }
  
  if (/document|documentation|guide|readme|comment/i.test(title + section + body)) {
    labels.push('area:documentation');
  }
  
  if (/performance|optimize|speed|cache|memo|usecallback/i.test(title + section + body)) {
    labels.push('type:performance');
  }
  
  if (/refactor|clean|redesign|restructure/i.test(title + section + body)) {
    labels.push('type:refactor');
  }
  
  if (/docker|deployment|ci|cd|pipeline|build/i.test(title + section + body)) {
    labels.push('area:devops');
  }
  
  if (/config|configuration|setup|jest\.config|webpack|typescript/i.test(title + section + body)) {
    labels.push('area:config');
  }
  
  return labels;
}

// Main function to extract tasks from NEXTSTEPS.md
async function extractTasksFromNextsteps() {
  console.log('Extracting tasks from NEXTSTEPS.md...');
  
  const content = fs.readFileSync(NEXTSTEPS_FILE, 'utf8');
  const lines = content.split('\n');
  
  const tasks = [];
  let currentSection = '';
  let currentTask = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect section headers
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim();
      continue;
    }
    
    // Detect task items (unchecked checkbox items)
    if (line.match(/^- \[ \]/)) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      const taskText = line.substring(6).trim();
      
      // Format task body with section context
      const taskBody = `**Context:** ${currentSection}\n\n**Task:** ${taskText}`;
      
      // Categorize the task and assign labels
      const labels = categorizeTask(taskText, currentSection, taskBody);
      
      currentTask = {
        title: taskText,
        body: taskBody,
        labels: labels,
      };
    } 
    // Add description text to the current task
    else if (currentTask && line.startsWith('  ') && line.length > 2) {
      currentTask.body += '\n\n' + line.trim();
    }
  }
  
  // Don't forget the last task
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  console.log(`Found ${tasks.length} tasks in NEXTSTEPS.md`);
  
  // Write tasks to individual JSON files
  tasks.forEach((task, index) => {
    const filename = path.join(OUTPUT_DIR, `task-${index + 1}.json`);
    fs.writeFileSync(filename, JSON.stringify(task, null, 2));
  });
  
  console.log(`Task JSON files generated in ${OUTPUT_DIR}`);
  return tasks;
}

// Function to extract issues from checkpoint.md
async function extractIssuesFromCheckpoint() {
  console.log('Extracting issues from checkpoint.md...');
  
  const content = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
  const sections = content.split(/^## /m);
  
  const issues = [];
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    // Skip sections that don't look like issues
    if (!title.includes('-') || !title.includes('[')) continue;
    
    const body = lines.slice(1).join('\n').trim();
    
    // Categorize the issue and assign labels
    const labels = categorizeTask(title, '', body);
    
    // Add status label if applicable
    if (title.toLowerCase().includes('progress') || title.toLowerCase().includes('status')) {
      labels.push('status:in-progress');
    }
    
    issues.push({
      title: title,
      body: body,
      labels: labels,
    });
  }
  
  console.log(`Found ${issues.length} issues in checkpoint.md`);
  
  // Write issues to individual JSON files
  issues.forEach((issue, index) => {
    const filename = path.join(OUTPUT_DIR, `checkpoint-issue-${index + 1}.json`);
    fs.writeFileSync(filename, JSON.stringify(issue, null, 2));
  });
  
  console.log(`Checkpoint issue JSON files generated in ${OUTPUT_DIR}`);
  return issues;
}

// Function to create a GitHub import file
function createGitHubImportFile(tasks, issues) {
  const allIssues = [...tasks, ...issues];
  
  const importData = {
    issues: allIssues.map((item, index) => ({
      id: index + 1,
      title: item.title,
      body: item.body,
      labels: item.labels
    }))
  };
  
  const filename = path.join(OUTPUT_DIR, 'github-import.json');
  fs.writeFileSync(filename, JSON.stringify(importData, null, 2));
  
  console.log(`GitHub import file generated: ${filename}`);
}

// Run the extraction
(async function run() {
  try {
    console.log('Starting GitHub Issues migration preparation...\n');
    
    const tasks = await extractTasksFromNextsteps();
    const issues = await extractIssuesFromCheckpoint();
    
    createGitHubImportFile(tasks, issues);
    
    console.log('\nMigration preparation complete!');
    console.log('\nNext steps:');
    console.log('1. Create the necessary labels in your GitHub repository');
    console.log('2. Review the JSON files in the github-issues directory');
    console.log('3. Use create-github-issues.js to create the issues');
    
  } catch (error) {
    console.error('Error during migration preparation:', error);
  }
})();