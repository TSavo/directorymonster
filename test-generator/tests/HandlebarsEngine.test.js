/**
 * @fileoverview Tests for the Handlebars template engine.
 * These tests verify that HandlebarsEngine correctly processes templates,
 * handles helpers, and manages template loading and compilation.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from 'jest';
import path from 'path';
import fs from 'fs';
import { HandlebarsEngine } from '../Core/HandlebarsEngine.js';

// Create test directory for file operations
const TEST_DIR = path.resolve(process.cwd(), 'test-generator/tests/temp-handlebars');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

describe('HandlebarsEngine', () => {
  let engine;
  let testTemplatesDir;
  
  beforeEach(() => {
    // Create a fresh engine instance for each test
    engine = new HandlebarsEngine();
    
    // Setup test templates directory
    testTemplatesDir = path.join(TEST_DIR, 'templates');
    if (!fs.existsSync(testTemplatesDir)) {
      fs.mkdirSync(testTemplatesDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Clean up test templates directory after each test
    if (fs.existsSync(testTemplatesDir)) {
      fs.readdirSync(testTemplatesDir).forEach(file => {
        fs.unlinkSync(path.join(testTemplatesDir, file));
      });
    }
  });
  
  // Core functionality tests
  describe('core functionality', () => {
    it('should initialize successfully', async () => {
      // Create test template file
      const templateFile = path.join(testTemplatesDir, 'test.hbs');
      fs.writeFileSync(templateFile, 'Hello, {{name}}!');
      
      const result = await engine.initialize(testTemplatesDir);
      expect(result).toBe(true);
      expect(engine.templates['test']).toBeDefined();
    });
    
    it('should handle initialization with non-existent directory', async () => {
      const nonExistentDir = path.join(TEST_DIR, 'nonexistent');
      const result = await engine.initialize(nonExistentDir);
      expect(result).toBe(false);
    });
    
    it('should load template from file', async () => {
      const templateFile = path.join(testTemplatesDir, 'file-test.hbs');
      const templateContent = 'Template from file: {{fileName}}';
      fs.writeFileSync(templateFile, templateContent);
      
      const result = await engine.loadTemplate('file-test', templateFile);
      expect(result).toBe(true);
      
      const processed = engine.processTemplate('file-test', { fileName: 'example.txt' });
      expect(processed).toBe('Template from file: example.txt');
    });
    
    it('should load template from string', () => {
      const templateContent = 'Template from string: {{content}}';
      const result = engine.loadTemplateFromString('string-test', templateContent);
      expect(result).toBe(true);
      
      const processed = engine.processTemplate('string-test', { content: 'Hello' });
      expect(processed).toBe('Template from string: Hello');
    });
    
    it('should throw error when template not found', () => {
      expect(() => {
        engine.processTemplate('nonexistent', {});
      }).toThrow('Template "nonexistent" not found');
    });
    
    it('should process a template string directly', () => {
      const template = 'Direct template: {{value}}';
      const processed = engine.processString(template, { value: 'test' });
      expect(processed).toBe('Direct template: test');
    });
    
    it('should generate content correctly', () => {
      const templateContent = 'Generated content: {{text}}';
      const data = { text: 'example' };
      const result = engine.generateContent(templateContent, data);
      expect(result).toBe('Generated content: example');
    });
  });
  
  // Built-in helpers tests
  describe('built-in helpers', () => {
    it('should convert string to camelCase', () => {
      const template = '{{camelCase "TestString"}}';
      const result = engine.processString(template, {});
      expect(result).toBe('testString');
    });
    
    it('should convert string to pascalCase', () => {
      const template = '{{pascalCase "testString"}}';
      const result = engine.processString(template, {});
      expect(result).toBe('TestString');
    });
    
    it('should convert string to kebabCase', () => {
      const template = '{{kebabCase "TestString"}}';
      const result = engine.processString(template, {});
      expect(result).toBe('test-string');
    });
    
    it('should join array with separator', () => {
      const template = '{{join items ", "}}';
      const data = { items: ['one', 'two', 'three'] };
      const result = engine.processString(template, data);
      expect(result).toBe('one, two, three');
    });
    
    it('should handle equality comparison', () => {
      const template = '{{#eq value1 value2}}Equal{{else}}Not equal{{/eq}}';
      
      let result = engine.processString(template, { value1: 5, value2: 5 });
      expect(result).toBe('Equal');
      
      result = engine.processString(template, { value1: 5, value2: 10 });
      expect(result).toBe('Not equal');
    });
    
    it('should handle greater than comparison', () => {
      const template = '{{#gt value1 value2}}Greater{{else}}Not greater{{/gt}}';
      
      let result = engine.processString(template, { value1: 10, value2: 5 });
      expect(result).toBe('Greater');
      
      result = engine.processString(template, { value1: 5, value2: 10 });
      expect(result).toBe('Not greater');
    });
    
    it('should handle less than comparison', () => {
      const template = '{{#lt value1 value2}}Less{{else}}Not less{{/lt}}';
      
      let result = engine.processString(template, { value1: 5, value2: 10 });
      expect(result).toBe('Less');
      
      result = engine.processString(template, { value1: 10, value2: 5 });
      expect(result).toBe('Not less');
    });
    
    it('should check if a value is in an array', () => {
      const template = '{{#includes array value}}Included{{else}}Not included{{/includes}}';
      const data = { array: ['one', 'two', 'three'] };
      
      let result = engine.processString(template, { ...data, value: 'two' });
      expect(result).toBe('Included');
      
      result = engine.processString(template, { ...data, value: 'four' });
      expect(result).toBe('Not included');
    });
    
    it('should get array length', () => {
      const template = 'Length: {{length array}}';
      const data = { array: ['one', 'two', 'three'] };
      const result = engine.processString(template, data);
      expect(result).toBe('Length: 3');
    });
    
    it('should check value type', () => {
      const template = '{{#ifType value "string"}}String{{else}}Not string{{/ifType}}';
      
      let result = engine.processString(template, { value: 'test' });
      expect(result).toBe('String');
      
      result = engine.processString(template, { value: 42 });
      expect(result).toBe('Not string');
    });
    
    it('should serialize to JSON', () => {
      const template = '{{json data}}';
      const data = { data: { name: 'Test', values: [1, 2, 3] } };
      const result = engine.processString(template, data);
      expect(result).toBe(JSON.stringify(data.data, null, 2));
    });
    
    it('should find an item in an array', () => {
      const template = '{{find items "id" targetId}}';
      const data = {
        items: [
          { id: 1, name: 'One' },
          { id: 2, name: 'Two' },
          { id: 3, name: 'Three' }
        ],
        targetId: 2
      };
      
      const result = engine.processString(template, data);
      expect(result).toBe('[object Object]'); // Default string representation of the object
    });
    
    it('should look up a dynamic property', () => {
      const template = '{{lookup obj field}}';
      const data = {
        obj: { name: 'Test', value: 42 },
        field: 'value'
      };
      
      const result = engine.processString(template, data);
      expect(result).toBe('42');
    });
    
    it('should filter an array', () => {
      const template = '{{#filter items "type" filterValue}}{{#each items}}{{this.name}}{{/each}}{{else}}No items{{/filter}}';
      const data = {
        items: [
          { name: 'A', type: 'letter' },
          { name: 'B', type: 'letter' },
          { name: '1', type: 'number' }
        ],
        filterValue: 'letter'
      };
      
      let result = engine.processString(template, data);
      expect(result).toBe('AB');
      
      result = engine.processString(template, { ...data, filterValue: 'symbol' });
      expect(result).toBe('No items');
    });
    
    it('should check if a value is truthy', () => {
      const template = '{{#isTruthy value}}Truthy{{else}}Falsy{{/isTruthy}}';
      
      let result = engine.processString(template, { value: true });
      expect(result).toBe('Truthy');
      
      result = engine.processString(template, { value: 'test' });
      expect(result).toBe('Truthy');
      
      result = engine.processString(template, { value: 0 });
      expect(result).toBe('Falsy');
      
      result = engine.processString(template, { value: '' });
      expect(result).toBe('Falsy');
      
      result = engine.processString(template, { value: null });
      expect(result).toBe('Falsy');
      
      result = engine.processString(template, { value: undefined });
      expect(result).toBe('Falsy');
    });
    
    it('should set a variable in the current context', () => {
      const template = '{{set "dynamicVar" "Dynamic Value"}}{{dynamicVar}}';
      const result = engine.processString(template, {});
      expect(result).toBe('Dynamic Value');
    });
  });
  
  // Error handling tests
  describe('error handling', () => {
    it('should handle errors when loading templates from file', async () => {
      // Non-existent file
      const nonExistentFile = path.join(testTemplatesDir, 'nonexistent.hbs');
      const result = await engine.loadTemplate('nonexistent', nonExistentFile);
      expect(result).toBe(false);
    });
    
    it('should handle errors when loading templates from string', () => {
      // Mock Handlebars.compile to throw an error
      const originalCompile = engine.handlebars.compile;
      engine.handlebars.compile = jest.fn().mockImplementation(() => {
        throw new Error('Mock compilation error');
      });
      
      const result = engine.loadTemplateFromString('error-template', '{{invalid syntax}}');
      expect(result).toBe(false);
      
      // Restore original compile method
      engine.handlebars.compile = originalCompile;
    });
    
    it('should handle errors when processing templates', () => {
      // Load a valid template first
      engine.loadTemplateFromString('error-test', '{{#invalidHelper}}Content{{/invalidHelper}}');
      
      expect(() => {
        engine.processTemplate('error-test', {});
      }).toThrow();
    });
    
    it('should handle errors when processing template strings', () => {
      expect(() => {
        engine.processString('{{#invalidHelper}}Content{{/invalidHelper}}', {});
      }).toThrow();
    });
  });
  
  // Complex template processing tests
  describe('complex template processing', () => {
    it('should process nested helpers and conditionals', () => {
      const template = `
        {{#if hasItems}}
          {{#each items}}
            {{#if (eq @index 0)}}First: {{/if}}
            {{#isTruthy this.active}}Active: {{/isTruthy}}
            {{this.name}}
            {{#unless @last}}, {{/unless}}
          {{/each}}
        {{else}}
          No items available
        {{/if}}
      `;
      
      const data = {
        hasItems: true,
        items: [
          { name: 'Item A', active: true },
          { name: 'Item B', active: false },
          { name: 'Item C', active: true }
        ]
      };
      
      const result = engine.processString(template, data).trim();
      expect(result).toContain('First: Active: Item A');
      expect(result).toContain('Item B');
      expect(result).toContain('Active: Item C');
      
      // Test with no items
      const emptyData = { hasItems: false, items: [] };
      const emptyResult = engine.processString(template, emptyData).trim();
      expect(emptyResult).toBe('No items available');
    });
    
    it('should process dynamic variable creation and lookup', () => {
      const template = `
        {{set "dynamicArray" items}}
        {{#each dynamicArray}}
          {{set "itemKey" (concat "item_" @index)}}
          {{set itemKey this.name}}
          {{lookup ../this itemKey}}
        {{/each}}
      `;
      
      const data = {
        items: [
          { name: 'First' },
          { name: 'Second' },
          { name: 'Third' }
        ]
      };
      
      // Register the concat helper for this test
      engine.handlebars.registerHelper('concat', function(...args) {
        // Remove the last argument (Handlebars options object)
        args.pop();
        return args.join('');
      });
      
      const result = engine.processString(template, data).trim();
      expect(result).toContain('First');
      expect(result).toContain('Second');
      expect(result).toContain('Third');
    });
  });
  
  // Component templates tests
  describe('component templates', () => {
    it('should process a form component template', () => {
      // Create a simplified form template
      const formTemplate = `
        import React, { useState } from 'react';
        
        {{#if hasProps}}
        /**
         * {{componentName}} component props
         */
        interface {{componentName}}Props {
          {{#each props}}
          {{#if required}}{{name}}: {{type}};{{else}}{{name}}?: {{type}};{{/if}}
          {{/each}}
        }
        {{/if}}
        
        /**
         * {{componentDescription}}
         */
        {{#if hasProps}}
        const {{componentName}} = ({ {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} }: {{componentName}}Props) => {
        {{else}}
        const {{componentName}} = () => {
        {{/if}}
          const [formData, setFormData] = useState({
            {{#each fields}}
            {{name}}: "",
            {{/each}}
          });
          
          return (
            <form>
              <h2>{{componentName}}</h2>
              {{#each fields}}
              <div>
                <label htmlFor="{{name}}">{{camelCase name}}</label>
                <input
                  id="{{name}}"
                  name="{{name}}"
                  type="{{type}}"
                  data-testid="{{kebabCase name}}-input"
                />
              </div>
              {{/each}}
              
              <button type="submit">Submit</button>
            </form>
          );
        };
        
        export default {{componentName}};
      `;
      
      // Create test data
      const data = {
        componentName: 'SignupForm',
        componentDescription: 'A form for user signup',
        hasProps: true,
        props: [
          { name: 'onSubmit', type: '(data: any) => void', required: true },
          { name: 'initialValues', type: 'Record<string, string>', required: false }
        ],
        fields: [
          { name: 'username', type: 'text' },
          { name: 'email', type: 'email' },
          { name: 'password', type: 'password' }
        ]
      };
      
      // Load template and process
      engine.loadTemplateFromString('formComponent', formTemplate);
      const result = engine.processTemplate('formComponent', data);
      
      // Verify output
      expect(result).toContain('interface SignupFormProps');
      expect(result).toContain('onSubmit: (data: any) => void;');
      expect(result).toContain('initialValues?: Record<string, string>;');
      expect(result).toContain('const SignupForm = ({ onSubmit, initialValues }: SignupFormProps)');
      expect(result).toContain('A form for user signup');
      expect(result).toContain('data-testid="username-input"');
      expect(result).toContain('data-testid="email-input"');
      expect(result).toContain('data-testid="password-input"');
    });

    it('should process a table component template', () => {
      // Create a simplified table template
      const tableTemplate = `
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
          return (
            <div className="table-container">
              <h2>{{componentName}}</h2>
              
              <table>
                <thead>
                  <tr>
                    {{#each columns}}
                    <th>{{this}}</th>
                    {{/each}}
                  </tr>
                </thead>
                <tbody>
                  {{#if hasPagination}}
                  {/* Pagination support */}
                  <tr>
                    <td colSpan="{{length columns}}">
                      <div className="pagination">
                        <button disabled={page === 1}>Previous</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page === totalPages}>Next</button>
                      </div>
                    </td>
                  </tr>
                  {{/if}}
                </tbody>
              </table>
            </div>
          );
        };
        
        export default {{componentName}};
      `;
      
      // Create test data
      const data = {
        componentName: 'UsersTable',
        componentDescription: 'A table to display users',
        hasProps: true,
        props: [
          { name: 'users', type: 'User[]', required: true },
          { name: 'loading', type: 'boolean', required: false, defaultValue: 'false' },
          { name: 'onUserSelect', type: '(user: User) => void', required: false }
        ],
        columns: ['ID', 'Name', 'Email', 'Role', 'Actions'],
        hasPagination: true
      };
      
      // Load template and process
      engine.loadTemplateFromString('tableComponent', tableTemplate);
      const result = engine.processTemplate('tableComponent', data);
      
      // Verify output
      expect(result).toContain('interface UsersTableProps');
      expect(result).toContain('users: User[];');
      expect(result).toContain('loading?: boolean;');
      expect(result).toContain('loading = false');
      expect(result).toContain('<th>ID</th>');
      expect(result).toContain('<th>Name</th>');
      expect(result).toContain('<th>Email</th>');
      expect(result).toContain('<th>Role</th>');
      expect(result).toContain('<th>Actions</th>');
      expect(result).toContain('<td colSpan="5">');
      expect(result).toContain('<div className="pagination">');
    });
  });
  
  // Clean up test directory after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });
});
