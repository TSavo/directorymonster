/**
 * @fileoverview Template management module for the test generator.
 * Handles template registration, retrieval, and validation.
 */

import { FileSystem } from '../Utils/FileSystem.js';
import path from 'path';
import fs from 'fs';

/**
 * Template metadata interface
 */
interface TemplateMetadata {
  [key: string]: any;
}

/**
 * Template object interface
 */
interface TemplateObject {
  content: string;
  metadata?: TemplateMetadata;
  [key: string]: any;
}

/**
 * Template property schema
 */
interface TemplatePropertySchema {
  type: string;
}

/**
 * Template schema interface
 */
interface TemplateSchema {
  required: string[];
  properties: Record<string, TemplatePropertySchema>;
}

/**
 * Template manager for the test generator
 */
class Template {
  /**
   * Directory containing templates
   */
  private templateDir: string;
  
  /**
   * Map of template names to template objects
   */
  private templates: Map<string, TemplateObject>;
  
  /**
   * Schema for validating templates
   */
  private templateSchema: TemplateSchema;
  
  /**
   * Create a new template manager
   * @param templateDir - Directory containing templates
   */
  constructor(templateDir: string) {
    this.templateDir = templateDir;
    this.templates = new Map<string, TemplateObject>();
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
   * @returns True if initialization was successful
   */
  async initialize(): Promise<boolean> {
    try {
      if (!FileSystem.directoryExists(this.templateDir)) {
        console.error(`Template directory not found: ${this.templateDir}`);
        return false;
      }

      // Only process .hbs files
      const files = fs.readdirSync(this.templateDir).filter(file => path.extname(file) === '.hbs');
      for (const file of files) {
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(this.templateDir, file);
        
        // Load and compile the template
        await this.loadTemplate(templateName, templatePath);
      }

      console.log(`Loaded ${this.templates.size} templates from ${this.templateDir}`);
      return true;
    } catch (error) {
      console.error(`Error initializing template manager: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Load a template from a file and register it with the manager
   * @param name - Name to register the template under
   * @param templatePath - Path to the template file
   * @returns Promise resolving to true if the template was loaded successfully
   */
  async loadTemplate(name: string, templatePath: string): Promise<boolean> {
    try {
      if (!FileSystem.fileExists(templatePath)) {
        console.error(`Template file not found: ${templatePath}`);
        return false;
      }

      // Read the template content
      const content = FileSystem.readFile(templatePath);
      if (!content) {
        console.error(`Failed to read template file: ${templatePath}`);
        return false;
      }

      // Create the template object
      const templateObject: TemplateObject = { 
        content,
        // Add metadata with the template file path for reference
        metadata: {
          path: templatePath,
          type: path.extname(templatePath).substring(1), // Remove the dot from extension
          lastModified: new Date().toISOString()
        }
      };

      // Register the template with the manager
      return this.registerTemplate(name, templateObject);
    } catch (error) {
      console.error(`Error loading template ${name} from ${templatePath}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Register a template with the manager
   * @param name - Name of the template
   * @param template - Template object with content and optional metadata
   * @returns True if the template was registered successfully
   */
  registerTemplate(name: string, template: TemplateObject): boolean {
    try {
      if (!this._validateTemplate(template)) {
        console.error(`Invalid template: ${name}`);
        return false;
      }

      this.templates.set(name, { ...template });
      console.log(`Registered template: ${name}`);
      return true;
    } catch (error) {
      console.error(`Error registering template: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get a template by name
   * @param name - Name of the template
   * @returns The template object or null if not found
   */
  getTemplate(name: string): TemplateObject | null {
    if (!this.templates.has(name)) {
      console.error(`Template not found: ${name}`);
      return null;
    }

    return { ...this.templates.get(name)! };
  }

  /**
   * Get a template by type and name
   * @param type - Type of template (e.g., 'test', 'component')
   * @param name - Name of the template
   * @returns The template object or null if not found
   */
  getTemplateByType(type: string, name: string): TemplateObject | null {
    const templateName = `${type}.${name}`;
    return this.getTemplate(templateName);
  }

  /**
   * Get all registered templates
   * @returns Map of template names to template objects
   */
  getAllTemplates(): Record<string, TemplateObject> {
    const result: Record<string, TemplateObject> = {};
    
    for (const [name, template] of this.templates.entries()) {
      result[name] = { ...template };
    }
    
    return result;
  }

  /**
   * Create a template from a file
   * @param filePath - Path to the template file
   * @param name - Optional name for the template
   * @returns True if the template was created successfully
   */
  createTemplateFromFile(filePath: string, name?: string): boolean {
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
      
      const templateObject: TemplateObject = { content };
      return this.registerTemplate(templateName, templateObject);
    } catch (error) {
      console.error(`Error creating template from file: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Save a template to a file
   * @param name - Name of the template
   * @param filePath - Path to save the template
   * @returns True if the template was saved successfully
   */
  saveTemplateToFile(name: string, filePath: string): boolean {
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
      console.error(`Error saving template to file: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Delete a template
   * @param name - Name of the template to delete
   * @returns True if the template was deleted successfully
   */
  deleteTemplate(name: string): boolean {
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
   * @param template - Template object to validate
   * @returns True if the template is valid
   * @private
   */
  private _validateTemplate(template: TemplateObject): boolean {
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
   * @param name - Name of the template to update
   * @param template - New template object
   * @returns True if the template was updated successfully
   */
  updateTemplate(name: string, template: TemplateObject): boolean {
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
   * @returns Array of template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a template exists
   * @param name - Name of the template
   * @returns True if the template exists
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Get the number of registered templates
   * @returns The number of templates
   */
  getTemplateCount(): number {
    return this.templates.size;
  }
}

export { Template, TemplateObject, TemplateMetadata };
