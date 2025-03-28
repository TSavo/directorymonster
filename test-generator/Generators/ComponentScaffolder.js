/**
 * @fileoverview Component scaffolder module for the test generator.
 * Creates component stubs that satisfy test requirements.
 */

import path from 'path';
import { FileSystem } from '../Utils/FileSystem.js';
import { Engine } from '../Core/Engine.js';

/**
 * Component scaffolder for the test generator tool
 */
class ComponentScaffolder {
  /**
   * Create a new component scaffolder
   * @param {Object} config - Configuration object
   * @param {Object} templateManager - Template manager instance
   */
  constructor(config, templateManager) {
    this.config = config;
    this.templateManager = templateManager;
    this.engine = new Engine();
  }

  /**
   * Scaffold a component based on requirements
   * @param {Object} requirements - Component requirements
   * @param {string} requirements.componentName - Name of the component
   * @param {string} requirements.category - Component category (e.g., 'admin/categories')
   * @param {string|string[]} requirements.features - Component features
   * @param {Object[]} requirements.props - Component props
   * @param {string} [requirements.componentType] - Type of component to scaffold (form, table, modal)
   * @param {Object} [options] - Scaffolding options
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
   * @param {string} [options.outputDir] - Custom output directory for component files
   * @returns {Object} Result object with success status and generated files
   */
  scaffoldComponent(requirements, options = {}) {
    // Process requirements before validation
    const processedRequirements = this._processRequirements(requirements);
    
    if (!processedRequirements) {
      return {
        success: false,
        error: 'Invalid component requirements',
        files: []
      };
    }

    try {
      const result = {
        success: true,
        files: [],
        errors: []
      };

      // Generate component file
      const componentResult = this._generateComponentFile(processedRequirements, options);
      if (componentResult.success) {
        result.files.push(componentResult.file);
      } else {
        result.success = false;
        result.errors.push(componentResult.error);
      }

      return result;
    } catch (error) {
      console.error(`Error scaffolding component: ${error.message}`);
      return {
        success: false,
        error: error.message,
        files: []
      };
    }
  }

  /**
   * Process and standardize component requirements
   * @param {Object} requirements - Raw component requirements
   * @returns {Object} Processed requirements or null if invalid
   * @private
   */
  _processRequirements(requirements) {
    if (!requirements || !requirements.componentName) {
      console.error('Missing required field: componentName');
      return null;
    }

    const processed = { ...requirements };

    // Convert features to array if it's a string
    if (typeof processed.features === 'string') {
      processed.features = processed.features.split(',').map(f => f.trim());
    } else if (!Array.isArray(processed.features)) {
      processed.features = [];
    }

    // Add component name in different cases
    processed.componentNameCamelCase = this._camelCase(processed.componentName);
    processed.componentNameKebabCase = this._kebabCase(processed.componentName);

    // Add default props if not provided
    if (!processed.props) {
      processed.props = [];
    }

    return processed;
  }

  /**
   * Generate a component file based on requirements
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Scaffolding options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateComponentFile(requirements, options) {
    try {
      // Determine which template to use based on component type or features
      const templateName = this._determineComponentTemplate(requirements);
      
      // Get template for component
      const template = this.templateManager.getTemplate(templateName);
      if (!template) {
        console.warn(`Template "${templateName}" not found, falling back to base template`);
        // Try to get base template as fallback
        const baseTemplate = this.templateManager.getTemplate('base');
        if (!baseTemplate) {
          throw new Error('No suitable component template found');
        }
        // Use base template
        return this._generateComponentWithTemplate(baseTemplate, requirements, options);
      }
      
      // Use the selected template
      return this._generateComponentWithTemplate(template, requirements, options);
    } catch (error) {
      console.error(`Error generating component file: ${error.message}`);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }
  
  /**
   * Generate a component using a specific template
   * @param {Object} template - Template object
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Scaffolding options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateComponentWithTemplate(template, requirements, options) {
    try {
      // Prepare data for template processing
      const data = this._prepareTemplateData(requirements);
      
      // Generate component content
      let content;
      if (template.content.includes('{componentName}')) {
        // Process the template with the engine
        content = this.engine.generateContent(template.content, data);
      } else {
        // Legacy fall back
        content = template.content;
      }
      
      // Determine output path
      const outputPath = this._determineComponentPath(requirements, options);
      
      // Create directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!FileSystem.directoryExists(outputDir)) {
        FileSystem.createDirectory(outputDir);
      }
      
      // Write the component file
      const writeResult = FileSystem.writeFile(
        outputPath, 
        content, 
        options.overwrite || false
      );
      
      if (!writeResult) {
        return {
          success: false,
          error: `Failed to write component file: ${outputPath}`,
          file: null
        };
      }
      
      return {
        success: true,
        file: outputPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  /**
   * Determine which component template to use based on requirements
   * @param {Object} requirements - Component requirements
   * @returns {string} Template name
   * @private
   */
  _determineComponentTemplate(requirements) {
    // Use explicitly specified component type if provided
    if (requirements.componentType) {
      return `${requirements.componentType}.component`;
    }
    
    // Determine component type based on features
    const { features = [] } = requirements;
    
    // Check for specific component types based on features
    if (features.includes('form') || features.includes('validation') || features.includes('submission')) {
      return 'form.component';
    }
    
    if (features.includes('table') || features.includes('pagination') || features.includes('sorting')) {
      return 'table.component';
    }
    
    if (features.includes('modal')) {
      return 'modal.component';
    }
    
    // Default to base component if no specific type is determined
    return 'base.component';
  }

  /**
   * Prepare template data based on component requirements
   * @param {Object} requirements - Component requirements
   * @returns {Object} Template data
   * @private
   */
  _prepareTemplateData(requirements) {
    const { componentName, category, features = [], props = [] } = requirements;

    // Basic template data
    const data = {
      componentName,
      componentNameCamelCase: this._camelCase(componentName),
      componentNameKebabCase: this._kebabCase(componentName),
      category,
      features,
      props,
      apiEndpoint: this._kebabCase(componentName.replace(/Table|Form|Modal|List|View/g, '')),
      resourcePath: category ? category.split('/').pop() : this._kebabCase(componentName.replace(/Table|Form|Modal|List|View/g, '')),
      itemName: this._getSingularItemName(componentName),
      componentDescription: requirements.description || `A reusable ${componentName} component`,
      // Derived properties
      hasProps: props.length > 0,
      requiredProps: props.filter(prop => prop.required),
      optionalProps: props.filter(prop => !prop.required),
      // Feature flags
      hasDynamicFields: features.includes('dynamicFields')
    };

    // Add feature-specific data
    for (const feature of features) {
      const featureConfig = this.config.get(`features.${feature}`);
      if (featureConfig) {
        data[`has${this._pascalCase(feature)}`] = true;
      }
    }

    return data;
  }

  /**
   * Determine the output path for a component file
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Scaffolding options
   * @returns {string} Output path
   * @private
   */
  _determineComponentPath(requirements, options) {
    const { componentName, category } = requirements;
    
    // Determine base output directory
    let outputDir = options.outputDir || this.config.get('paths.components');
    
    // Add category subdirectories if provided
    if (category) {
      outputDir = path.join(outputDir, category);
    }
    
    // Create directory if it doesn't exist
    if (!FileSystem.directoryExists(outputDir)) {
      FileSystem.createDirectory(outputDir);
    }
    
    // Create final filename
    const filename = `${componentName}.tsx`;
    
    return path.join(outputDir, filename);
  }

  /**
   * Convert a string to camelCase
   * @param {string} str - String to convert
   * @returns {string} Converted string
   * @private
   */
  _camelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Convert a string to PascalCase
   * @param {string} str - String to convert
   * @returns {string} Converted string
   * @private
   */
  _pascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert a string to kebab-case
   * @param {string} str - String to convert
   * @returns {string} Converted string
   * @private
   */
  _kebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Get singular item name from component name
   * @param {string} componentName - Component name
   * @returns {string} Singular item name
   * @private
   */
  _getSingularItemName(componentName) {
    // Extract base name (remove Table, Form, etc.)
    let baseName = componentName.replace(/Table|Form|Modal|List|View/g, '');
    
    // Handle plural forms
    if (baseName.endsWith('ies')) {
      return baseName.replace(/ies$/, 'y');
    } else if (baseName.endsWith('s')) {
      return baseName.slice(0, -1);
    }
    
    return baseName;
  }
}

export { ComponentScaffolder };
