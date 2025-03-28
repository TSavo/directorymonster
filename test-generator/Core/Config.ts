/**
 * @fileoverview Configuration management module for the test generator.
 * Handles loading, validating, and accessing configuration settings.
 */

import fs from 'fs';
import path from 'path';

/**
 * Interface for configuration paths
 */
interface ConfigPaths {
  templates: string;
  tests: string;
  components: string;
  fixtures: string;
  [key: string]: string;
}

/**
 * Interface for test type configuration
 */
interface TestTypeConfig {
  template: string;
  suffix: string;
  description: string;
}

/**
 * Interface for feature configuration
 */
interface FeatureConfig {
  description: string;
  assertions: string[];
}

/**
 * Interface for the complete configuration object
 */
interface ConfigObject {
  paths: ConfigPaths;
  testTypes: Record<string, TestTypeConfig>;
  features: Record<string, FeatureConfig>;
  [key: string]: any;
}

/**
 * Default configuration settings
 */
const DEFAULT_CONFIG: ConfigObject = {
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
   * Internal configuration storage
   */
  private _config: ConfigObject;
  
  /**
   * Path to the configuration file
   */
  private _configPath: string;
  
  /**
   * Create a new configuration instance
   * @param configPath - Path to a custom configuration file
   */
  constructor(configPath?: string) {
    this._config = { ...DEFAULT_CONFIG };
    this._configPath = configPath || './test-generator/test-generator.config.json';
    
    // Don't load in constructor to allow async loading
  }

  /**
   * Load configuration from file
   * @returns True if configuration was loaded successfully
   */
  async load(): Promise<boolean> {
    try {
      if (fs.existsSync(this._configPath)) {
        await this._loadCustomConfig(this._configPath);
      } else {
        console.warn(`Configuration file not found: ${this._configPath}`);
        console.warn('Using default configuration.');
      }
      
      this._validateConfig();
      return true;
    } catch (error) {
    console.error(`Error loading configuration: ${(error as Error).message}`);
      console.warn('Using default configuration.');
      return false;
    }
  }

  /**
   * Load a custom configuration file and merge with defaults
   * @param configPath - Path to the custom configuration file
   * @returns True if configuration was loaded successfully
   * @private
   */
  private async _loadCustomConfig(configPath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.warn(`Configuration file not found: ${configPath}`);
        console.warn('Using default configuration.');
        return false;
      }
      
      // Read and parse the custom configuration
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const customConfig = JSON.parse(fileContent);
      
      // Deep merge with defaults
      this._config = this._mergeConfigs(this._config, customConfig);
      
      console.log(`Successfully loaded configuration from: ${configPath}`);
      return true;
    } catch (error) {
      console.error(`Error loading configuration file: ${(error as Error).message}`);
      console.warn('Using default configuration.');
      return false;
    }
  }
  
  /**
   * Deep merge two configuration objects
   * @param target - Target config object
   * @param source - Source config object to merge in
   * @returns Merged configuration
   * @private
   */
  private _mergeConfigs(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
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
  private _validateConfig(): void {
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
   * @param configPath - Dot-notation path to the configuration value
   * @param defaultValue - Default value to return if path not found
   * @returns The configuration value or default if not found
   */
  get<T = any>(configPath: string, defaultValue?: T): T {
    const pathParts = configPath.split('.');
    let current = this._config as any;
    
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
   * @returns The complete configuration object
   */
  getAll(): ConfigObject {
    return { ...this._config };
  }

  /**
   * Get all test types
   * @returns Object containing all test types
   */
  getTestTypes(): Record<string, TestTypeConfig> {
    return { ...this._config.testTypes };
  }

  /**
   * Get template path for a specific test type
   * @param testType - The type of test
   * @returns The path to the template file
   */
  getTemplatePath(testType: string): string {
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
   * @returns Object containing all features
   */
  getFeatures(): Record<string, FeatureConfig> {
    return { ...this._config.features };
  }
  
  /**
   * Set a configuration value by its path
   * @param configPath - Dot-notation path to the configuration value
   * @param value - Value to set
   */
  set(configPath: string, value: any): void {
    const pathParts = configPath.split('.');
    let current: any = this._config;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
  }

  /**
   * Save the current configuration to a file
   * @param filePath - Path to save the configuration (defaults to this._configPath)
   * @returns True if saved successfully
   */
  async save(filePath?: string): Promise<boolean> {
    const savePath = filePath || this._configPath;
    
    try {
      const dirPath = path.dirname(savePath);
      
      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write configuration to file
      fs.writeFileSync(
        savePath, 
        JSON.stringify(this._config, null, 2), 
        'utf8'
      );
      
      console.log(`Configuration saved to: ${savePath}`);
      return true;
    } catch (error) {
      console.error(`Error saving configuration: ${(error as Error).message}`);
      return false;
    }
  }
}

export { Config };
