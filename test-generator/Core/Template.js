/**
 * @fileoverview Template management module for the test generator.
 * Handles template registration, retrieval, and validation.
 */

import { FileSystem } from '../Utils/FileSystem.js';

/**
 * Template manager for the test generator
 */
class Template {
  /**
   * Create a new template manager
   * @param {string} templateDir - Directory containing templates
   */
  constructor(templateDir) {
    this.templateDir = templateDir;
    this.templates = new Map();
    this.templateSchema = {
      required: ['content'],
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' }
      }
    };
  }

  /**
   * Initialize the template manager by loading default templates
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize() {
    try {
      if (!FileSystem.directoryExists(this.templateDir)) {
        console.error(`Template directory not found: ${this.templateDir}`);
        return false;
      }

      // Load templates from directory
      const templateFiles = FileSystem.listFiles(this.templateDir, /\.template$/);
      if (!templateFiles || templateFiles.length === 0) {
        console.warn(`No template files found in directory: ${this.templateDir}`);
        return false;
      }

      // Register each template
      for (const templateFile of templateFiles) {
        const templateName = FileSystem.getBasename(templateFile, '.template');
        const templateContent = FileSystem.readFile(templateFile);
        
        if (templateContent) {
          this.registerTemplate(templateName, { content: templateContent });
        }
      }

      console.log(`Loaded ${this.templates.size} templates from ${this.templateDir}`);
      return true;
    } catch (error) {
      console.error(`Error initializing template manager: ${error.message}`);
      return false;
    }
  }

  /**
   * Register a template with the manager
   * @param {string} name - Name of the template
   * @param {Object} template - Template object with content and optional metadata
   * @returns {boolean} True if the template was registered successfully
   */
  registerTemplate(name, template) {
    try {
      if (!this._validateTemplate(template)) {
        console.error(`Invalid template: ${name}`);
        return false;
      }

      this.templates.set(name, { ...template });
      console.log(`Registered template: ${name}`);
      return true;
    } catch (error) {
      console.error(`Error registering template: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a template by name
   * @param {string} name - Name of the template
   * @returns {Object|null} The template object or null if not found
   */
  getTemplate(name) {
    if (!this.templates.has(name)) {
      console.error(`Template not found: ${name}`);
      return null;
    }

    return { ...this.templates.get(name) };
  }

  /**
   * Get a template by type and name
   * @param {string} type - Type of template (e.g., 'test', 'component')
   * @param {string} name - Name of the template
   * @returns {Object|null} The template object or null if not found
   */
  getTemplateByType(type, name) {
    const templateName = `${type}.${name}`;
    return this.getTemplate(templateName);
  }

  /**
   * Get all registered templates
   * @returns {Object} Map of template names to template objects
   */
  getAllTemplates() {
    const result = {};
    
    for (const [name, template] of this.templates.entries()) {
      result[name] = { ...template };
    }
    
    return result;
  }

  /**
   * Create a template from a file
   * @param {string} filePath - Path to the template file
   * @param {string} [name] - Optional name for the template
   * @returns {boolean} True if the template was created successfully
   */
  createTemplateFromFile(filePath, name) {
    try {
      if (!FileSystem.fileExists(filePath)) {
        console.error(`Template file not found: ${filePath}`);
        return false;
      }

      const content = FileSystem.readFile(filePath);
      if (!content) {
        return false;
      }

      // Use filename as template name if not provided
      const templateName = name || FileSystem.getBasename(filePath, '.template');
      
      return this.registerTemplate(templateName, { content });
    } catch (error) {
      console.error(`Error creating template from file: ${error.message}`);
      return false;
    }
  }

  /**
   * Save a template to a file
   * @param {string} name - Name of the template
   * @param {string} filePath - Path to save the template
   * @returns {boolean} True if the template was saved successfully
   */
  saveTemplateToFile(name, filePath) {
    try {
      const template = this.getTemplate(name);
      if (!template) {
        return false;
      }

      // Ensure the template has a .template extension
      let outputPath = filePath;
      if (!outputPath.endsWith('.template')) {
        outputPath += '.template';
      }

      return FileSystem.writeFile(outputPath, template.content);
    } catch (error) {
      console.error(`Error saving template to file: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a template
   * @param {string} name - Name of the template to delete
   * @returns {boolean} True if the template was deleted successfully
   */
  deleteTemplate(name) {
    if (!this.templates.has(name)) {
      console.error(`Template not found: ${name}`);
      return false;
    }

    this.templates.delete(name);
    console.log(`Deleted template: ${name}`);
    return true;
  }

  /**
   * Validate a template against the schema
   * @param {Object} template - Template object to validate
   * @returns {boolean} True if the template is valid
   * @private
   */
  _validateTemplate(template) {
    // Check required fields
    for (const field of this.templateSchema.required) {
      if (!(field in template)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Check property types
    for (const [prop, spec] of Object.entries(this.templateSchema.properties)) {
      if (prop in template && typeof template[prop] !== spec.type) {
        console.error(`Invalid type for ${prop}: expected ${spec.type}, got ${typeof template[prop]}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Update an existing template
   * @param {string} name - Name of the template to update
   * @param {Object} template - New template object
   * @returns {boolean} True if the template was updated successfully
   */
  updateTemplate(name, template) {
    if (!this.templates.has(name)) {
      console.error(`Template not found: ${name}`);
      return false;
    }
    
    if (!this._validateTemplate(template)) {
      console.error(`Invalid template: ${name}`);
      return false;
    }
    
    this.templates.set(name, { ...template });
    console.log(`Updated template: ${name}`);
    return true;
  }

  /**
   * Get names of all registered templates
   * @returns {string[]} Array of template names
   */
  getTemplateNames() {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a template exists
   * @param {string} name - Name of the template
   * @returns {boolean} True if the template exists
   */
  hasTemplate(name) {
    return this.templates.has(name);
  }

  /**
   * Get the number of registered templates
   * @returns {number} The number of templates
   */
  getTemplateCount() {
    return this.templates.size;
  }
}

export { Template };
