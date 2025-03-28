/**
 * @fileoverview Configuration management module for the test generator.
 * Handles loading, validating, and accessing configuration settings.
 */

import fs from 'fs';
import path from 'path';

/**
 * Default configuration settings
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  paths: {
    templates: path.resolve(process.cwd(), 'test-generator/templates'),
    tests: path.resolve(process.cwd(), 'tests'),
    components: path.resolve(process.cwd(), 'src/components'),
    fixtures: path.resolve(process.cwd(), 'tests/fixtures'),
  },
  testTypes: {
    base: { 
      template: 'base.test.template',
      suffix: '.test.tsx',
      description: 'Basic rendering, props, and state tests'
    },
    actions: { 
      template: 'actions.test.template',
      suffix: '.actions.test.tsx',
      description: 'User interactions and event handling tests'
    },
    hierarchy: { 
      template: 'hierarchy.test.template',
      suffix: '.hierarchy.test.tsx',
      description: 'Parent-child relationship and hierarchical display tests'
    },
    sorting: { 
      template: 'sorting.test.template',
      suffix: '.sorting.test.tsx',
      description: 'Column sorting and sort indicators tests'
    },
    accessibility: { 
      template: 'accessibility.test.template',
      suffix: '.accessibility.test.tsx',
      description: 'ARIA attributes, keyboard navigation, and focus management tests'
    }
  },
  features: {
    form: { 
      description: 'Form elements and submission handling',
      assertions: ['form submission', 'input validation', 'field interactions']
    },
    'data-loading': { 
      description: 'Data fetching and loading states',
      assertions: ['loading state', 'data display', 'error handling']
    },
    sorting: { 
      description: 'Column sorting functionality',
      assertions: ['sort indicators', 'sort direction', 'data ordering']
    },
    hierarchy: { 
      description: 'Tree structure and parent-child relationships',
      assertions: ['indentation', 'parent-child indicators', 'collapsible sections']
    },
    pagination: { 
      description: 'Results pagination controls',
      assertions: ['page navigation', 'page size selection', 'page information']
    },
    filtering: { 
      description: 'Data filtering capabilities',
      assertions: ['filter controls', 'filtered results', 'filter clearing']
    },
    keyboard: { 
      description: 'Keyboard navigation and focus management',
      assertions: ['focus indicators', 'keyboard shortcuts', 'tab order']
    },
    accessibility: { 
      description: 'Accessibility features and compliance',
      assertions: ['ARIA attributes', 'screen reader support', 'color contrast']
    },
    interaction: { 
      description: 'User interactions and event handling',
      assertions: ['click events', 'hover states', 'drag and drop']
    },
    responsive: { 
      description: 'Responsive design and mobile adaptation',
      assertions: ['mobile view', 'desktop view', 'breakpoint behavior']
    },
    errors: { 
      description: 'Error handling and display',
      assertions: ['error messages', 'error recovery', 'validation errors']
    }
  }
};

/**
 * Configuration manager for the test generator
 */
class Config {
  /**
   * Create a new configuration instance
   * @param {string} [configPath] - Path to a custom configuration file
   */
  constructor(configPath) {
    this._config = { ...DEFAULT_CONFIG };
    
    if (configPath) {
      this._loadCustomConfig(configPath);
    }
    
    this._validateConfig();
  }

  /**
   * Load a custom configuration file and merge with defaults
   * @param {string} configPath - Path to the custom configuration file
   * @private
   */
  _loadCustomConfig(configPath) {
    try {
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.warn(`Configuration file not found: ${configPath}`);
        console.warn('Using default configuration.');
        return;
      }
      
      // Read and parse the custom configuration
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Deep merge with defaults
      this._config = this._mergeConfigs(this._config, customConfig);
      
      console.log(`Successfully loaded configuration from: ${configPath}`);
    } catch (error) {
      console.error(`Error loading configuration file: ${error.message}`);
      console.warn('Using default configuration.');
    }
  }
  
  /**
   * Deep merge two configuration objects
   * @param {Object} target - Target config object
   * @param {Object} source - Source config object to merge in
   * @returns {Object} Merged configuration
   * @private
   */
  _mergeConfigs(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          source[key] && 
          typeof source[key] === 'object' && 
          !Array.isArray(source[key])
        ) {
          output[key] = this._mergeConfigs(
            Object.prototype.hasOwnProperty.call(target, key) ? target[key] : {}, 
            source[key]
          );
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  }

  /**
   * Validate the configuration
   * @private
   */
  _validateConfig() {
    // Validate paths
    for (const [key, pathValue] of Object.entries(this._config.paths)) {
      // Convert to absolute path if relative
      if (!path.isAbsolute(pathValue)) {
        this._config.paths[key] = path.resolve(process.cwd(), pathValue);
      }
    }
    
    // Validate test types
    for (const testType of Object.values(this._config.testTypes)) {
      if (!testType.template) {
        throw new Error(`Test type missing template: ${JSON.stringify(testType)}`);
      }
      if (!testType.suffix) {
        throw new Error(`Test type missing suffix: ${JSON.stringify(testType)}`);
      }
    }
  }

  /**
   * Get a configuration value by its path
   * @param {string} configPath - Dot-notation path to the configuration value
   * @param {*} [defaultValue] - Default value to return if path not found
   * @returns {*} The configuration value or default if not found
   */
  get(configPath, defaultValue) {
    const pathParts = configPath.split('.');
    let current = this._config;
    
    for (const part of pathParts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * Get the entire configuration object
   * @returns {Object} The complete configuration object
   */
  getAll() {
    return { ...this._config };
  }

  /**
   * Get all test types
   * @returns {Object} Object containing all test types
   */
  getTestTypes() {
    return { ...this._config.testTypes };
  }

  /**
   * Get template path for a specific test type
   * @param {string} testType - The type of test
   * @returns {string} The path to the template file
   */
  getTemplatePath(testType) {
    const testTypeConfig = this._config.testTypes[testType];
    if (!testTypeConfig) {
      throw new Error(`Unknown test type: ${testType}`);
    }
    
    return path.join(
      this._config.paths.templates, 
      testTypeConfig.template
    );
  }

  /**
   * Get all available features
   * @returns {Object} Object containing all features
   */
  getFeatures() {
    return { ...this._config.features };
  }

  /**
   * Save the current configuration to a file
   * @param {string} filePath - Path to save the configuration
   * @returns {boolean} True if saved successfully
   */
  saveConfig(filePath) {
    try {
      const dirPath = path.dirname(filePath);
      
      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write configuration to file
      fs.writeFileSync(
        filePath, 
        JSON.stringify(this._config, null, 2), 
        'utf8'
      );
      
      console.log(`Configuration saved to: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error saving configuration: ${error.message}`);
      return false;
    }
  }
}

export { Config };
