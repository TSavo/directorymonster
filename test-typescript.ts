/**
 * Simple test script to verify TypeScript conversion
 */
import { HandlebarsEngine } from './test-generator/Core/HandlebarsEngine.js';
import { Config } from './test-generator/Core/Config.js';
import { Template } from './test-generator/Core/Template.js';
import { FileSystem } from './test-generator/Utils/FileSystem.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test directories
const TEST_DIR = path.join(__dirname, 'ts-test-temp');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Create subdirectories for templates and output
const TEMPLATES_DIR = path.join(TEST_DIR, 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

const OUTPUT_DIR = path.join(TEST_DIR, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create a test template file
const testTemplatePath = path.join(TEMPLATES_DIR, 'test.hbs');
fs.writeFileSync(testTemplatePath, 'Hello, {{name}}! Welcome to {{description}}.');

// Create test config file
const configPath = path.join(TEST_DIR, 'test-config.json');
fs.writeFileSync(configPath, JSON.stringify({
  paths: {
    templates: TEMPLATES_DIR,
    output: OUTPUT_DIR
  },
  testTypes: {
    component: {
      template: 'component.test.template',
      suffix: '.test.tsx'
    }
  }
}, null, 2));

async function runTests() {
  console.log('Running TypeScript Conversion Tests...');
  let allTestsPassed = true;
  
  // Test FileSystem utility
  console.log('\n=== Testing FileSystem ===');
  try {
    // Test file operations
    console.log('Testing file operations...');
    const testFilePath = path.join(TEST_DIR, 'test-file.txt');
    const testContent = 'Test content for TypeScript conversion';
    
    // Write file
    const writeResult = FileSystem.writeFile(testFilePath, testContent);
    console.log(`Write file: ${writeResult ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && writeResult;
    
    // Read file
    const readContent = FileSystem.readFile(testFilePath);
    console.log(`Read file: ${readContent === testContent ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (readContent === testContent);
    
    // File exists
    const fileExists = FileSystem.fileExists(testFilePath);
    console.log(`File exists: ${fileExists ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && fileExists;
    
    // Directory exists
    const dirExists = FileSystem.directoryExists(TEST_DIR);
    console.log(`Directory exists: ${dirExists ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && dirExists;
    
    // List files
    const files = FileSystem.listFiles(TEST_DIR) || [];
    console.log(`List files: ${files && files.length > 0 ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (files && files.length > 0);
    
    // Path utilities
    const baseName = FileSystem.getBasename(testFilePath);
    console.log(`Get basename: ${baseName === 'test-file.txt' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (baseName === 'test-file.txt');
    
    const extension = FileSystem.getExtension(testFilePath);
    console.log(`Get extension: ${extension === '.txt' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (extension === '.txt');
  } catch (error) {
    console.error('FileSystem test error:', error);
    allTestsPassed = false;
  }
  
  // Test Config
  console.log('\n=== Testing Config ===');
  try {
    // Initialize config
    const config = new Config(configPath);
    await config.load();
    
    // Get config values
    const templatesPath = config.get('paths.templates');
    console.log(`Get config value: ${templatesPath === TEMPLATES_DIR ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (templatesPath === TEMPLATES_DIR);
    
    // Set config value
    config.set('testValue', 'test');
    const testValue = config.get('testValue');
    console.log(`Set config value: ${testValue === 'test' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (testValue === 'test');
    
    // Get all config
    const allConfig = config.getAll();
    console.log(`Get all config: ${allConfig && typeof allConfig === 'object' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (allConfig && typeof allConfig === 'object');
  } catch (error) {
    console.error('Config test error:', error);
    allTestsPassed = false;
  }
  
  // Test Template
  console.log('\n=== Testing Template ===');
  try {
    // Initialize template manager
    const templateManager = new Template(TEMPLATES_DIR);
    await templateManager.initialize();
    
    // Create template from file
    const createResult = templateManager.createTemplateFromFile(testTemplatePath);
    console.log(`Create template from file: ${createResult ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && createResult;
    
    // Get template
    const templateName = FileSystem.getBasename(testTemplatePath, '.hbs');
    const template = templateManager.getTemplate(templateName);
    console.log(`Get template: ${template !== null ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (template !== null);
    
    // Check template count
    const templateCount = templateManager.getTemplateCount();
    console.log(`Template count: ${templateCount > 0 ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (templateCount > 0);
    
    // Test new loadTemplate method
    console.log('\n--- Testing loadTemplate method ---');
    
    // Create a new test template file
    const newTestTemplatePath = path.join(TEMPLATES_DIR, 'loadtest.hbs');
    fs.writeFileSync(newTestTemplatePath, 'Test template for loadTemplate method');
    
    // Create a new template manager to test loadTemplate specifically 
    const loadTestManager = new Template(TEMPLATES_DIR);
    
    // Test direct loadTemplate method
    const loadResult = await loadTestManager.loadTemplate('load-test', newTestTemplatePath) || false;
    console.log(`loadTemplate method: ${loadResult ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && loadResult;
    
    // Verify template was loaded correctly
    const loadedTemplate = loadTestManager.getTemplate('load-test');
    const templateContent = loadedTemplate?.content || '';
    console.log(`loadTemplate content: ${loadedTemplate && templateContent === 'Test template for loadTemplate method' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && Boolean(loadedTemplate && templateContent === 'Test template for loadTemplate method');
    
    // Verify metadata was added
    const metadataPath = loadedTemplate?.metadata?.path || '';
    console.log(`loadTemplate metadata: ${loadedTemplate && metadataPath === newTestTemplatePath ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && Boolean(loadedTemplate && metadataPath === newTestTemplatePath);
    
    // Test loadTemplate with non-existent file
    const nonExistentPath = path.join(TEMPLATES_DIR, 'nonexistent.hbs');
    const failedLoadResult = await loadTestManager.loadTemplate('nonexistent', nonExistentPath) || false;
    console.log(`loadTemplate with non-existent file: ${!failedLoadResult ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && !failedLoadResult;
  } catch (error) {
    console.error('Template test error:', error);
    allTestsPassed = false;
  }
  
  // Test HandlebarsEngine
  console.log('\n=== Testing HandlebarsEngine ===');
  try {
    // Initialize engine
    const engine = new HandlebarsEngine();
    await engine.initialize(TEMPLATES_DIR);
    
    // Load template
    const loadResult = await engine.loadTemplate('test-template', testTemplatePath);
    console.log(`Load template: ${loadResult ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && loadResult;
    
    // Process template
    const processResult = engine.processTemplate('test-template', { 
      name: 'TypeScript', 
      description: 'Strongly typed JavaScript' 
    });
    console.log(`Process template: ${processResult === 'Hello, TypeScript! Welcome to Strongly typed JavaScript.' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (processResult === 'Hello, TypeScript! Welcome to Strongly typed JavaScript.');
    
    // Process string directly
    const stringTemplate = 'Testing {{feature}} with {{language}}';
    const stringResult = engine.processString(stringTemplate, { 
      feature: 'templates', 
      language: 'TypeScript' 
    });
    console.log(`Process string: ${stringResult === 'Testing templates with TypeScript' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (stringResult === 'Testing templates with TypeScript');
    
    // Test helpers
    const camelCaseTemplate = '{{camelCase "TestString"}}';
    const camelCaseResult = engine.processString(camelCaseTemplate, {});
    console.log(`camelCase helper: ${camelCaseResult === 'testString' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (camelCaseResult === 'testString');
    
    const pascalCaseTemplate = '{{pascalCase "testString"}}';
    const pascalCaseResult = engine.processString(pascalCaseTemplate, {});
    console.log(`pascalCase helper: ${pascalCaseResult === 'TestString' ? 'PASS' : 'FAIL'}`);
    allTestsPassed = allTestsPassed && (pascalCaseResult === 'TestString');
  } catch (error) {
    console.error('HandlebarsEngine test error:', error);
    allTestsPassed = false;
  }
  
  // Final test summary
  console.log('\n=== Test Summary ===');
  console.log(`All tests ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  // Clean up test directory
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    console.log('Test directory cleaned up successfully.');
  } catch (error) {
    console.error('Error cleaning up test directory:', error);
  }
  
  return allTestsPassed;
}

// Run the tests
runTests().then(result => {
  console.log(`Tests completed with ${result ? 'SUCCESS' : 'FAILURE'}`);
  process.exit(result ? 0 : 1);
}).catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
