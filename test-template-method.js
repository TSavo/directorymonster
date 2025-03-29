// Simple test script to verify the Template.loadTemplate method
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Template } from './test-generator/Core/Template.js';

// Setup test environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test directories
const TEST_DIR = path.join(__dirname, 'template-test-temp');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Create a test template file
const testTemplatePath = path.join(TEST_DIR, 'test-template.hbs');
fs.writeFileSync(testTemplatePath, 'Test content for loadTemplate method');

async function runLoadTemplateTest() {
  console.log('Testing Template.loadTemplate method...');
  
  try {
    // Create a template manager
    const templateManager = new Template(TEST_DIR);
    
    // Test the loadTemplate method
    console.log('Calling loadTemplate method...');
    const loadResult = await templateManager.loadTemplate('test-template', testTemplatePath);
    console.log(`loadTemplate result: ${loadResult}`);
    
    // Verify the template was loaded
    const template = templateManager.getTemplate('test-template');
    if (template) {
      console.log('Template was loaded successfully!');
      console.log(`Content: ${template.content}`);
      