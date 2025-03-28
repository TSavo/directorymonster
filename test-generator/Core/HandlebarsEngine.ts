/**
 * @fileoverview Handlebars template engine for the test generator.
 * Handles variable substitution, conditional logic, loops, and content generation
 * using the Handlebars templating library.
 */

import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Define types for Handlebars helpers
type HelperOptions = Handlebars.HelperOptions;
type HelperDelegate = Handlebars.HelperDelegate;
type TemplateDelegate<T = any> = Handlebars.TemplateDelegate<T>;

/**
 * Handlebars-based template engine for the test generator
 */
class HandlebarsEngine {
  /**
   * The Handlebars instance
   */
  private handlebars: typeof Handlebars;
  
  /**
   * Compiled templates storage
   */
  public templates: Record<string, TemplateDelegate>;
  
  /**
   * Create a new Handlebars template engine
   */
  constructor() {
    // Create a new Handlebars instance
    this.handlebars = Handlebars.create();
    
    // Store compiled templates
    this.templates = {};
    
    // Register built-in helpers
    this._registerHelpers();
  }

  /**
   * Initialize the engine and load templates
   * @param templatesDir - Directory containing templates
   * @returns Success status
   */
  async initialize(templatesDir: string): Promise<boolean> {
    try {
      console.log(`Loading templates from ${templatesDir}`);
      
      // Check if directory exists
      if (!fs.existsSync(templatesDir)) {
        console.error(`Templates directory does not exist: ${templatesDir}`);
        return false;
      }
      
      // Read all template files
      const files = fs.readdirSync(templatesDir);
      for (const file of files) {
        // Only process .hbs files
        if (path.extname(file) !== '.hbs') {
          continue;
        }
        
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(templatesDir, file);
        
        // Load and compile the template
        await this.loadTemplate(templateName, templatePath);
      }
      
      console.log(`Loaded ${Object.keys(this.templates).length} templates`);
      return true;
    } catch (error) {
      console.error(`Error initializing HandlebarsEngine: ${(error as Error).message}`);
      console.error((error as Error).stack);
      return false;
    }
  }

  /**
   * Load and compile a template from a file
   * @param templateName - Name of the template
   * @param templatePath - Path to the template file
   * @returns Success status
   */
  async loadTemplate(templateName: string, templatePath: string): Promise<boolean> {
    try {
      // Read the template file
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      this.templates[templateName] = this.handlebars.compile(content, {
        noEscape: true  // Don't escape HTML in the template
      });
      
      console.log(`Loaded template: ${templateName}`);
      return true;
    } catch (error) {
      console.error(`Error loading template ${templateName}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Load and compile a template from a string
   * @param templateName - Name of the template
   * @param templateContent - Content of the template
   * @returns Success status
   */
  loadTemplateFromString(templateName: string, templateContent: string): boolean {
    try {
      // Compile the template
      this.templates[templateName] = this.handlebars.compile(templateContent, {
        noEscape: true  // Don't escape HTML in the template
      });
      
      console.log(`Loaded template from string: ${templateName}`);
      return true;
    } catch (error) {
      console.error(`Error loading template from string ${templateName}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Process a template with data
   * @param templateName - Name of the template to process
   * @param data - Data to use for template processing
   * @returns Processed template
   * @throws Error if template not found
   */
  processTemplate(templateName: string, data: Record<string, any>): string {
    try {
      if (!this.templates[templateName]) {
        throw new Error(`Template "${templateName}" not found`);
      }
      
      // Process the template with the data
      return this.templates[templateName](data);
    } catch (error) {
      console.error(`Error processing template "${templateName}": ${(error as Error).message}`);
      console.error((error as Error).stack);
      throw error;
    }
  }

  /**
   * Process a template string directly with data
   * @param template - Template string to process
   * @param data - Data to use for template processing
   * @returns Processed template
   * @throws Error if template compilation or processing fails
   */
  processString(template: string, data: Record<string, any>): string {
    try {
      // Compile the template
      const compiledTemplate = this.handlebars.compile(template, {
        noEscape: true  // Don't escape HTML in the template
      });
      
      // Process the template with the data
      return compiledTemplate(data);
    } catch (error) {
      console.error(`Error processing template string: ${(error as Error).message}`);
      console.error((error as Error).stack);
      throw error;
    }
  }

  /**
   * Register built-in helpers for the template engine
   * @private
   */
  private _registerHelpers(): void {
    // Convert string to camelCase
    this.handlebars.registerHelper('camelCase', (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toLowerCase() + str.slice(1);
    });
    
    // Convert string to PascalCase
    this.handlebars.registerHelper('pascalCase', (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    
    // Convert string to kebab-case
    this.handlebars.registerHelper('kebabCase', (str: string): string => {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });
    
    // Join array with separator
    this.handlebars.registerHelper('join', (array: any[], separator?: string): string => {
      if (!array || !Array.isArray(array)) return '';
      return array.join(separator || '');
    });
    
    // Equality comparison
    this.handlebars.registerHelper('eq', (a: any, b: any, options: Handlebars.HelperOptions): string => {
      return a === b ? options.fn(options.data.root) : options.inverse(options.data.root);
    });
    
    // Greater than comparison
    this.handlebars.registerHelper('gt', (a: any, b: any, options: Handlebars.HelperOptions): string => {
      return a > b ? options.fn(options.data.root) : options.inverse(options.data.root);
    });
    
    // Less than comparison
    this.handlebars.registerHelper('lt', (a: any, b: any, options: Handlebars.HelperOptions): string => {
      return a < b ? options.fn(options.data.root) : options.inverse(options.data.root);
    });
    
    // Check if a value is in an array
    this.handlebars.registerHelper('includes', (array: any[], value: any, options: Handlebars.HelperOptions): string => {
      if (!array || !Array.isArray(array)) return options.inverse(options.data.root);
      return array.includes(value) ? options.fn(options.data.root) : options.inverse(options.data.root);
    });
    
    // Get array length
    this.handlebars.registerHelper('length', (array: any[]): number => {
      if (!array || !Array.isArray(array)) return 0;
      return array.length;
    });
    
    // Conditional check for types
    this.handlebars.registerHelper('ifType', (value: any, type: string, options: Handlebars.HelperOptions): string => {
      return typeof value === type ? options.fn(options.data.root) : options.inverse(options.data.root);
    });
    
    // Get JSON string for debugging
    this.handlebars.registerHelper('json', (context: any): string => {
      return JSON.stringify(context, null, 2);
    });
    
    // Get first item that matches from array
    this.handlebars.registerHelper('find', (array: any[], key: string, value: any): any => {
      if (!array || !Array.isArray(array)) return null;
      return array.find(item => item[key] === value);
    });
    
    // Lookup - access dynamic properties
    this.handlebars.registerHelper('lookup', (obj: Record<string, any>, field: string): any => {
      if (!obj) return null;
      return obj[field];
    });
    
    // Filter array
    this.handlebars.registerHelper('filter', (array: any[], key: string, value: any, options: Handlebars.HelperOptions): string => {
      if (!array || !Array.isArray(array)) return options.inverse(options.data.root);
      const filtered = array.filter(item => item[key] === value);
      return filtered.length > 0 ? options.fn({items: filtered}) : options.inverse(options.data.root);
    });
    
    // Check if a value is truthy
    this.handlebars.registerHelper('isTruthy', (value: any, options: Handlebars.HelperOptions): string => {
      return value ? options.fn(options.data.root) : options.inverse(options.data.root);
    });
    
    // Set a variable in the current context
    this.handlebars.registerHelper('set', (name: string, value: any, options: Handlebars.HelperOptions): void => {
      options.data.root[name] = value;
    });
  }

  /**
   * Generate content from a template
   * @param templateContent - Template content
   * @param data - Data for template processing
   * @returns Generated content
   */
  generateContent(templateContent: string, data: Record<string, any>): string {
    return this.processString(templateContent, data);
  }
}

export { HandlebarsEngine };
