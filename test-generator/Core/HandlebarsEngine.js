/**
 * @fileoverview Handlebars template engine for the test generator.
 * Handles variable substitution, conditional logic, loops, and content generation
 * using the Handlebars templating library.
 */

import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

/**
 * Handlebars-based template engine for the test generator
 */
class HandlebarsEngine {
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
   * @param {string} templatesDir - Directory containing templates
   * @returns {Promise<boolean>} Success status
   */
  async initialize(templatesDir) {
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
      console.error(`Error initializing HandlebarsEngine: ${error.message}`);
      console.error(error.stack);
      return false;
    }
  }

  /**
   * Load and compile a template from a file
   * @param {string} templateName - Name of the template
   * @param {string} templatePath - Path to the template file
   * @returns {Promise<boolean>} Success status
   */
  async loadTemplate(templateName, templatePath) {
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
      console.error(`Error loading template ${templateName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Load and compile a template from a string
   * @param {string} templateName - Name of the template
   * @param {string} templateContent - Content of the template
   * @returns {boolean} Success status
   */
  loadTemplateFromString(templateName, templateContent) {
    try {
      // Compile the template
      this.templates[templateName] = this.handlebars.compile(templateContent, {
        noEscape: true  // Don't escape HTML in the template
      });
      
      console.log(`Loaded template from string: ${templateName}`);
      return true;
    } catch (error) {
      console.error(`Error loading template from string ${templateName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Process a template with data
   * @param {string} templateName - Name of the template to process
   * @param {Object} data - Data to use for template processing
   * @returns {string} Processed template
   */
  processTemplate(templateName, data) {
    try {
      if (!this.templates[templateName]) {
        throw new Error(`Template "${templateName}" not found`);
      }
      
      // Process the template with the data
      return this.templates[templateName](data);
    } catch (error) {
      console.error(`Error processing template "${templateName}": ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Process a template string directly with data
   * @param {string} template - Template string to process
   * @param {Object} data - Data to use for template processing
   * @returns {string} Processed template
   */
  processString(template, data) {
    try {
      // Compile the template
      const compiledTemplate = this.handlebars.compile(template, {
        noEscape: true  // Don't escape HTML in the template
      });
      
      // Process the template with the data
      return compiledTemplate(data);
    } catch (error) {
      console.error(`Error processing template string: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Register built-in helpers for the template engine
   * @private
   */
  _registerHelpers() {
    // Convert string to camelCase
    this.handlebars.registerHelper('camelCase', function(str) {
      if (!str) return '';
      return str.charAt(0).toLowerCase() + str.slice(1);
    });
    
    // Convert string to PascalCase
    this.handlebars.registerHelper('pascalCase', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    
    // Convert string to kebab-case
    this.handlebars.registerHelper('kebabCase', function(str) {
      if (!str) return '';
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });
    
    // Join array with separator
    this.handlebars.registerHelper('join', function(array, separator) {
      if (!array || !Array.isArray(array)) return '';
      return array.join(separator || '');
    });
    
    // Equality comparison
    this.handlebars.registerHelper('eq', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
    
    // Greater than comparison
    this.handlebars.registerHelper('gt', function(a, b, options) {
      return a > b ? options.fn(this) : options.inverse(this);
    });
    
    // Less than comparison
    this.handlebars.registerHelper('lt', function(a, b, options) {
      return a < b ? options.fn(this) : options.inverse(this);
    });
    
    // Check if a value is in an array
    this.handlebars.registerHelper('includes', function(array, value, options) {
      if (!array || !Array.isArray(array)) return options.inverse(this);
      return array.includes(value) ? options.fn(this) : options.inverse(this);
    });
    
    // Get array length
    this.handlebars.registerHelper('length', function(array) {
      if (!array || !Array.isArray(array)) return 0;
      return array.length;
    });
    
    // Conditional check for types
    this.handlebars.registerHelper('ifType', function(value, type, options) {
      return typeof value === type ? options.fn(this) : options.inverse(this);
    });
    
    // Get JSON string for debugging
    this.handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });
    
    // Get first item that matches from array
    this.handlebars.registerHelper('find', function(array, key, value) {
      if (!array || !Array.isArray(array)) return null;
      return array.find(item => item[key] === value);
    });
    
    // Lookup - access dynamic properties
    this.handlebars.registerHelper('lookup', function(obj, field) {
      if (!obj) return null;
      return obj[field];
    });
    
    // Filter array
    this.handlebars.registerHelper('filter', function(array, key, value, options) {
      if (!array || !Array.isArray(array)) return options.inverse(this);
      const filtered = array.filter(item => item[key] === value);
      return filtered.length > 0 ? options.fn({items: filtered}) : options.inverse(this);
    });
    
    // Check if a value is truthy
    this.handlebars.registerHelper('isTruthy', function(value, options) {
      return value ? options.fn(this) : options.inverse(this);
    });
    
    // Set a variable in the current context
    this.handlebars.registerHelper('set', function(name, value, options) {
      options.data.root[name] = value;
    });
  }

  /**
   * Generate content from a template
   * @param {string} templateContent - Template content
   * @param {Object} data - Data for template processing
   * @returns {string} Generated content
   */
  generateContent(templateContent, data) {
    return this.processString(templateContent, data);
  }
}

export { HandlebarsEngine };
