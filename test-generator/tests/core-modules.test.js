/**
 * @fileoverview Tests for core modules of the test generator.
 */

import { describe, it, expect } from 'jest';
import path from 'path';
import fs from 'fs';

import Config from '../Core/Config.js';
import FileSystem from '../Utils/FileSystem.js';
import Template from '../Core/Template.js';
import Engine from '../Core/Engine.js';

// Create test directory for file operations
const TEST_DIR = path.resolve(process.cwd(), 'test-generator/tests/temp');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

describe('Config Module', () => {
  it('loads default configuration', () => {
    const config = new Config();
    expect(config.getAll()).toBeDefined();
    expect(config.get('paths.templates')).toBeDefined();
    expect(config.get('testTypes.base')).toBeDefined();
  });

  it('merges custom configuration', () => {
    const customConfigPath = path.join(TEST_DIR, 'custom-config.json');
    const customConfig = {
      paths: {
        templates: './custom-templates'
      }
    };

    // Write custom config file
    fs.writeFileSync(
      customConfigPath,
      JSON.stringify(customConfig),
      'utf8'
    );

    const config = new Config(customConfigPath);
    expect(config.get('paths.templates')).toContain('custom-templates');
    
    // Clean up
    fs.unlinkSync(customConfigPath);
  });

  it('handles invalid paths gracefully', () => {
    const config = new Config();
    expect(config.get('nonexistent.path')).toBeUndefined();
    expect(config.get('nonexistent.path', 'default')).toBe('default');
  });
});

describe('FileSystem Module', () => {
  it('creates directories', () => {
    const testSubDir = path.join(TEST_DIR, 'subdir');
    
    expect(FileSystem.createDirectory(testSubDir)).toBe(true);
    expect(fs.existsSync(testSubDir)).toBe(true);
    
    // Clean up
    fs.rmdirSync(testSubDir);
  });

  it('writes and reads files', () => {
    const testFile = path.join(TEST_DIR, 'test-file.txt');
    const testContent = 'Test file content';
    
    expect(FileSystem.writeFile(testFile, testContent)).toBe(true);
    expect(FileSystem.fileExists(testFile)).toBe(true);
    expect(FileSystem.readFile(testFile)).toBe(testContent);
    
    // Clean up
    fs.unlinkSync(testFile);
  });

  it('handles nonexistent files gracefully', () => {
    const nonexistentFile = path.join(TEST_DIR, 'nonexistent.txt');
    
    expect(FileSystem.fileExists(nonexistentFile)).toBe(false);
    expect(FileSystem.readFile(nonexistentFile)).toBeNull();
  });
});

describe('Template Module', () => {
  it('registers and retrieves templates', () => {
    const templateDir = path.join(TEST_DIR, 'templates');
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    const template = new Template(templateDir);
    const testTemplate = { content: 'Test template content' };
    
    expect(template.registerTemplate('test', testTemplate)).toBe(true);
    expect(template.hasTemplate('test')).toBe(true);
    expect(template.getTemplate('test')).toEqual(testTemplate);
    
    // Clean up
    fs.rmdirSync(templateDir);
  });

  it('validates templates', () => {
    const template = new Template(TEST_DIR);
    const invalidTemplate = { metadata: {} }; // Missing required content field
    
    expect(template.registerTemplate('invalid', invalidTemplate)).toBe(false);
    expect(template.hasTemplate('invalid')).toBe(false);
  });
});

describe('Engine Module', () => {
  it('processes variables in templates', () => {
    const engine = new Engine();
    const template = 'Hello, {name}!';
    const variables = { name: 'World' };
    
    expect(engine.process(template, variables)).toBe('Hello, World!');
  });

  it('processes conditional logic', () => {
    const engine = new Engine();
    const template = '{if showGreeting}Hello, {name}!{else}Goodbye!{/if}';
    
    expect(engine.process(template, { showGreeting: true, name: 'World' }))
      .toBe('Hello, World!');
    expect(engine.process(template, { showGreeting: false }))
      .toBe('Goodbye!');
  });

  it('processes loops', () => {
    const engine = new Engine();
    const template = 'Items:{for item in items}\n- {item}{/for}';
    const variables = { items: ['one', 'two', 'three'] };
    
    expect(engine.process(template, variables))
      .toBe('Items:\n- one\n- two\n- three');
  });

  it('handles deep object paths', () => {
    const engine = new Engine();
    const template = '{user.profile.firstName} {user.profile.lastName}';
    const variables = { 
      user: { 
        profile: { 
          firstName: 'John', 
          lastName: 'Doe' 
        } 
      } 
    };
    
    expect(engine.process(template, variables)).toBe('John Doe');
  });
});

describe('Integrated Core Modules', () => {
  it('works together to process templates', () => {
    // Setup test environment
    const templateDir = path.join(TEST_DIR, 'templates');
    FileSystem.createDirectory(templateDir);
    
    // Create a test template file
    const templateFile = path.join(templateDir, 'component.test.template');
    const templateContent = `
/**
 * Test suite for the {componentName} component
 */
describe('{componentName} Component', () => {
  {if hasProps}
  it('renders with props', () => {
    // Test rendering with props
  });
  {/if}

  {if features.includes("loading")}
  it('displays loading state', () => {
    // Test loading state
  });
  {/if}

  {if features.includes("error")}
  it('handles errors', () => {
    // Test error handling
  });
  {/if}

  {for feature in features}
  // Tests for feature: {feature}
  {/for}
});
`;
    FileSystem.writeFile(templateFile, templateContent);
    
    // Initialize modules
    const config = new Config();
    const template = new Template(templateDir);
    template.createTemplateFromFile(templateFile, 'component.test');
    
    const engine = new Engine();
    
    // Use the template with test data
    const testTemplate = template.getTemplate('component.test');
    const testData = {
      componentName: 'Button',
      hasProps: true,
      features: ['loading', 'click', 'focus']
    };
    
    const generatedContent = engine.generateContent(testTemplate.content, testData);
    
    // Verify integration
    expect(generatedContent).toContain('Test suite for the Button component');
    expect(generatedContent).toContain('it(\'renders with props\'');
    expect(generatedContent).toContain('it(\'displays loading state\'');
    expect(generatedContent).not.toContain('it(\'handles errors\'');
    expect(generatedContent).toContain('// Tests for feature: loading');
    expect(generatedContent).toContain('// Tests for feature: click');
    expect(generatedContent).toContain('// Tests for feature: focus');
    
    // Clean up
    fs.unlinkSync(templateFile);
    fs.rmdirSync(templateDir);
  });
});

// Clean up test directory after all tests
afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});
