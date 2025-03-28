/**
 * Simple test runner for HandlebarsEngine
 */
import { HandlebarsEngine } from './test-generator/Core/HandlebarsEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test directory
const TEST_DIR = path.join(__dirname, 'test-temp');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Create templates directory
const TEMPLATES_DIR = path.join(TEST_DIR, 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Create a test template file
const testTemplatePath = path.join(TEMPLATES_DIR, 'test.hbs');
fs.writeFileSync(testTemplatePath, 'Hello, {{name}}!');

// Create engine instance
const engine = new HandlebarsEngine();

async function runTests() {
  console.log('Running HandlebarsEngine tests...');
  
  try {
    // Test 1: Initialize
    console.log('\nTest 1: Initialize the engine');
    const initResult = await engine.initialize(TEMPLATES_DIR);
    console.log(`  Result: ${initResult ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Test template loading
    console.log('\nTest 2: Load template from file');
    const loadResult = await engine.loadTemplate('test-file', testTemplatePath);
    console.log(`  Result: ${loadResult ? 'PASS' : 'FAIL'}`);
    
    // Test 3: Test template from string
    console.log('\nTest 3: Load template from string');
    const stringTemplate = 'Template from string: {{content}}';
    const stringResult = engine.loadTemplateFromString('string-test', stringTemplate);
    console.log(`  Result: ${stringResult ? 'PASS' : 'FAIL'}`);
    
    // Test 4: Process template
    console.log('\nTest 4: Process template');
    let processResult;
    try {
      processResult = engine.processTemplate('string-test', { content: 'Hello' });
      console.log(`  Result: ${processResult === 'Template from string: Hello' ? 'PASS' : 'FAIL'}`);
      console.log(`  Output: ${processResult}`);
    } catch (error) {
      console.log(`  Result: FAIL`);
      console.log(`  Error: ${error.message}`);
    }
    
    // Test 5: Process string directly
    console.log('\nTest 5: Process string directly');
    const directTemplate = 'Direct template: {{value}}';
    const directResult = engine.processString(directTemplate, { value: 'test' });
    console.log(`  Result: ${directResult === 'Direct template: test' ? 'PASS' : 'FAIL'}`);
    console.log(`  Output: ${directResult}`);
    
    // Test 6: Generate content
    console.log('\nTest 6: Generate content');
    const genTemplate = 'Generated content: {{text}}';
    const genResult = engine.generateContent(genTemplate, { text: 'example' });
    console.log(`  Result: ${genResult === 'Generated content: example' ? 'PASS' : 'FAIL'}`);
    console.log(`  Output: ${genResult}`);
    
    // Test 7: Test helpers
    console.log('\nTest 7: Test built-in helpers');
    
    // camelCase helper
    const camelResult = engine.processString('{{camelCase "TestString"}}', {});
    console.log(`  camelCase: ${camelResult === 'testString' ? 'PASS' : 'FAIL'}`);
    
    // pascalCase helper
    const pascalResult = engine.processString('{{pascalCase "testString"}}', {});
    console.log(`  pascalCase: ${pascalResult === 'TestString' ? 'PASS' : 'FAIL'}`);
    
    // kebabCase helper
    const kebabResult = engine.processString('{{kebabCase "TestString"}}', {});
    console.log(`  kebabCase: ${kebabResult === 'test-string' ? 'PASS' : 'FAIL'}`);
    
    // join helper
    const joinResult = engine.processString('{{join items ", "}}', { items: ['one', 'two', 'three'] });
    console.log(`  join: ${joinResult === 'one, two, three' ? 'PASS' : 'FAIL'}`);
    
    // eq helper
    const eqResult1 = engine.processString('{{#eq value1 value2}}Equal{{else}}Not equal{{/eq}}', { value1: 5, value2: 5 });
    const eqResult2 = engine.processString('{{#eq value1 value2}}Equal{{else}}Not equal{{/eq}}', { value1: 5, value2: 10 });
    console.log(`  eq (equal): ${eqResult1 === 'Equal' ? 'PASS' : 'FAIL'}`);
    console.log(`  eq (not equal): ${eqResult2 === 'Not equal' ? 'PASS' : 'FAIL'}`);
    
    // Test 8: Complex template
    console.log('\nTest 8: Process complex template');
    const complexTemplate = `{{#if hasItems}}{{#each items}}{{#if @first}}First: {{/if}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}No items available{{/if}}`;
    
    const complexData = {
      hasItems: true,
      items: [
        { name: 'Item A' },
        { name: 'Item B' },
        { name: 'Item C' }
      ]
    };
    
    const complexResult = engine.processString(complexTemplate, complexData);
    console.log(`  Result: ${complexResult === 'First: Item A, Item B, Item C' ? 'PASS' : 'FAIL'}`);
    console.log(`  Output: ${complexResult}`);
    
    // Test 9: Component template processing
    console.log('\nTest 9: Process component template');
    const componentTemplate = `
import React from 'react';

/**
 * {{componentDescription}}
 */
{{#if hasProps}}
interface {{componentName}}Props {
  {{#each props}}
  {{#if required}}{{name}}: {{type}};{{else}}{{name}}?: {{type}};{{/if}}
  {{/each}}
}
{{/if}}

const {{componentName}} = ({
  {{#each props}}
  {{name}}{{#unless required}} = {{defaultValue}}{{/unless}}{{#unless @last}},{{/unless}}
  {{/each}}
}{{#if hasProps}}: {{componentName}}Props{{/if}}) => {
  return <div>Component content</div>;
};

export default {{componentName}};
`;

    const componentData = {
      componentName: 'UserProfile',
      componentDescription: 'User profile component',
      hasProps: true,
      props: [
        { name: 'userId', type: 'string', required: true },
        { name: 'showAvatar', type: 'boolean', required: false, defaultValue: 'true' }
      ]
    };

    const componentResult = engine.processString(componentTemplate, componentData);
    console.log(`  Result: ${componentResult.includes('interface UserProfileProps') && componentResult.includes('userId: string;') ? 'PASS' : 'FAIL'}`);
    
    // Test 10: Error handling
    console.log('\nTest 10: Error handling');
    try {
      // Try to process a non-existent template
      engine.processTemplate('nonexistent', {});
      console.log(`  Result: FAIL - Should have thrown an error`);
    } catch (error) {
      console.log(`  Result: PASS - Correctly threw error: ${error.message}`);
    }
    
    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }
}

// Run tests
runTests();
