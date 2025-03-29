/**
 * Simple test for Template.loadTemplate method
 */
import { Template } from './test-generator/Core/Template.js';
import { FileSystem } from './test-generator/Utils/FileSystem.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test directories
const TEST_DIR = path.join(__dirname, 'template-load-test');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

const TEMPLATES_DIR = path.join(TEST_DIR, 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Create a test template file
const testTemplatePath = path.join(TEMPLATES_DIR, 'test-template.hbs');
fs.writeFileSync(testTemplatePath, 'Test content for loadTemplate method');

async function runTest() {
  console.log('Testing Template.loadTemplate method...');
  
  try {
    // Initialize template manager
    const templateManager = new Template(TEMPLATES_DIR);
    
    // Test direct loadTemplate method
    console.log('Testing loadTemplate with valid file...');
    const loadResult = await templateManager.loadTemplate('test-template', testTemplatePath);
    console.log(`loadTemplate result: ${loadResult ? 'SUCCESS' : 'FAILED'}`);
    
    // Verify template was loaded correctly
    const loadedTemplate = templateManager.getTemplate('test-template');
    if (loadedTemplate && loadedTemplate.content === 'Test content for loadTemplate method') {
      console.log('Template content verification: SUCCESS');
    } else {
      console.log('Template content verification: FAILED');
      if (loadedTemplate) {
        console.log(`Expected: 'Test content for loadTemplate method'`);
        console.log(`Actual: '${loadedTemplate.content}'`);
      } else {
        console.log('Template not found after loading');
      }
    }
    
    // Verify metadata was added
    if (loadedTemplate && loadedTemplate.metadata && loadedTemplate.metadata.path === testTemplatePath) {
      console.log('Template metadata verification: SUCCESS');
    } else {
      console.log('Template metadata verification: FAILED');
      if (loadedTemplate && loadedTemplate.metadata) {
        console.log(`Expected metadata path: '${testTemplatePath}'`);
        console.log(`Actual metadata path: '${loadedTemplate.metadata.path}'`);
      } else {
        console.log('Template metadata not found');
      }
    }
    
    // Test loadTemplate with non-existent file
    console.log('\nTesting loadTemplate with non-existent file...');
    const nonExistentPath = path.join(TEMPLATES_DIR, 'nonexistent.hbs');
    const failedLoadResult = await templateManager.loadTemplate('nonexistent', nonExistentPath);
    console.log(`Non-existent file rejection: ${!failedLoadResult ? 'SUCCESS' : 'FAILED'}`);
    
    // Test initialize method (which uses loadTemplate internally)
    console.log('\nTesting initialize method...');
    
    // Create a second test template for initialization
    const secondTemplatePath = path.join(TEMPLATES_DIR, 'second-template.hbs');
    fs.writeFileSync(secondTemplatePath, 'Second template content');
    
    // Initialize a new template manager