# Handlebars Integration Example

## Installation

```bash
npm install handlebars --save-dev
```

## Basic Integration

```javascript
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Simple wrapper around Handlebars
class TemplateEngine {
  constructor() {
    this.handlebars = Handlebars.create();
    this.templates = {};
    
    // Register built-in helpers
    this.registerHelpers();
  }
  
  // Load a template from file
  loadTemplate(templateName, templatePath) {
    try {
      const content = fs.readFileSync(templatePath, 'utf8');
      this.templates[templateName] = this.handlebars.compile(content);
      return true;
    } catch (error) {
      console.error(`Error loading template ${templateName}: ${error.message}`);
      return false;
    }
  }
  
  // Process a template with data
  processTemplate(templateName, data) {
    if (!this.templates[templateName]) {
      throw new Error(`Template ${templateName} not loaded`);
    }
    
    try {
      return this.templates[templateName](data);
    } catch (error) {
      console.error(`Error processing template ${templateName}: ${error.message}`);
      throw error;
    }
  }
  
  // Register custom helpers for component generation
  registerHelpers() {
    // Convert string to camelCase
    this.handlebars.registerHelper('camelCase', function(str) {
      return str.charAt(0).toLowerCase() + str.slice(1);
    });
    
    // Convert string to PascalCase
    this.handlebars.registerHelper('pascalCase', function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    
    // Convert string to kebab-case
    this.handlebars.registerHelper('kebabCase', function(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });
    
    // Join array with separator
    this.handlebars.registerHelper('join', function(array, separator) {
      return array.join(separator);
    });
    
    // Conditional checking
    this.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });
  }
}

export { TemplateEngine };
```

## Example Component Template

```handlebars
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * {{componentName}} - {{componentDescription}}
 * 
 * A form component for creating and editing {{itemName}} data.
 * 
 * Features:
 * - Form validation with error messages
 * - API integration for submission
 * - Loading states and error handling
 * - Accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export interface {{componentName}}Props {
  /**
   * Initial data for editing an existing item
   */
  initialData?: {
    id?: string;
    {{#each props}}
    {{this.name}}?: {{this.type}};
    {{/each}}
  };
  /**
   * Mode for the form (create or edit)
   */
  mode?: 'create' | 'edit';
  /**
   * Callback when form is canceled
   */
  onCancel?: () => void;
  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: (data: any) => void;
  /**
   * API endpoint for form submission
   */
  apiEndpoint?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  initialData = {},
  mode = 'create',
  onCancel,
  onSuccess,
  apiEndpoint = '/api/{{kebabCase apiEndpoint}}'
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  {{#if hasDynamicFields}}
  // Dynamic fields state
  const [dynamicFields, setDynamicFields] = useState<string[]>(initialData.dynamicFields || []);
  {{/if}}

  // Form state
  {{#each props}}
  const [{{this.name}}, set{{pascalCase this.name}}] = useState<{{this.type}}>(initialData.{{this.name}} || {{#if this.defaultValue}}{{this.defaultValue}}{{else}}{{#ifEquals this.type "string[]"}}[]{{else}}''{{/ifEquals}}{{/if}});
  {{/each}}
  
  // Validation state
  const [errors, setErrors] = useState<{
    {{#each props}}
    {{this.name}}?: string;
    {{/each}}
    format?: string;
  }>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    {{#each props}}
    if (name === '{{this.name}}') set{{pascalCase this.name}}(value);
    {{/each}}
    
    // Clear error when field is changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Form fields
  return (
    <div className="form-container">
      {{#each props}}
      <div className="form-field">
        <label htmlFor="{{../componentNameCamelCase}}-{{this.name}}">{{this.label}}</label>
        <input
          type="text"
          id="{{../componentNameCamelCase}}-{{this.name}}"
          name="{{this.name}}"
          value={ {{this.name}} }
          onChange={handleChange}
          data-testid="{{../componentNameCamelCase}}-{{this.name}}"
        />
      </div>
      {{/each}}
    </div>
  );
};
```

## Using the New Engine

```javascript
import { TemplateEngine } from './TemplateEngine.js';
import path from 'path';

// Initialize the engine
const engine = new TemplateEngine();

// Load templates
const templatesDir = path.join(process.cwd(), 'templates');
engine.loadTemplate('form.component', path.join(templatesDir, 'form.component.hbs'));

// Data for template
const data = {
  componentName: 'SiteForm',
  componentDescription: 'Form for creating and editing site configurations',
  itemName: 'Site',
  componentNameCamelCase: 'siteForm',
  apiEndpoint: 'sites',
  props: [
    { name: 'name', type: 'string', required: true, label: 'Site Name' },
    { name: 'slug', type: 'string', required: true, label: 'Slug' },
    { name: 'description', type: 'string', required: false, label: 'Description' },
    { name: 'domains', type: 'string[]', required: true, label: 'Domains' }
  ],
  hasDynamicFields: true
};

// Process template
const content = engine.processTemplate('form.component', data);
console.log(content);
```

## Advantages of This Approach

1. **Standard Syntax**: Handlebars uses a widely-known template syntax that is easier to read and maintain.

2. **Built-in Features**: Handlebars has built-in support for loops, conditionals, and helpers.

3. **Better Error Handling**: Handlebars provides detailed error messages when templates fail to compile or render.

4. **Extensibility**: Easy to add custom helpers for specialized formatting needs.

5. **Maintainability**: The code is much simpler and follows standard patterns, making it easier for other developers to understand and modify.

## Implementation Steps

1. Install Handlebars as a dependency
2. Create the TemplateEngine wrapper class 
3. Convert existing templates to Handlebars syntax
4. Update the ComponentScaffolder to use the new engine
5. Test with simple components to verify functionality
