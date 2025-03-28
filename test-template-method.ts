/**
 * Simple test for Template.loadTemplate method
 */
import { Template } from './test-generator/Core/Template.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test directory
const TEST_DIR = path.join(__dirname, 'test-temp');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Create a test template file
const templateContent = 'Test content for loadTemplate method';
const templatePath = path.join(TEST_DIR, 'test-template.hbs');
fs.writeFileSync(templatePath, templateContent);

async function testLoadTemplate() {
  const templateManager = new Template(TEST_DIR);
  
  // Test the loadTemplate method
  console.log('Testing loadTemplate method...');
  const success = await templateManager.loadTemplate('test-template', templatePath);
  
  if (success) {
    console.log('✅ loadTemplate method returned success');
    
    // Verify the template was loaded correctly
    const template = templateManager.getTemplate('test-template');
    if (template && template.content === templateContent) {
      console.log('✅ Template content verified');
    } else {
      console.log('❌ Template content verification failed');
      if (template) {
        console.log(`Expected: ${templateContent}`);
        console.log(`Actual: ${template.content}`);
      } else {
        console.log('Template not found after loading');
      }
    }
    
    // Check metadata
    if (template && template.metadata && template.metadata.path === templatePath) {
      console.log('✅ Template metadata verified');
    } else {
      console.log('❌ Template metadata verification failed');
    }
  } else {
    console.log('❌ loadTemplate method failed');
  }
  
  // Clean up
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

testLoadTemplate().catch(error => {
  console.error('Test failed:', error);
  // Clean up in case of error
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});