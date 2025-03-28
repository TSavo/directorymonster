/**
 * @fileoverview Test file generator module for the test generator.
 * Generates test files based on component requirements.
 */

import path from 'path';
import { FileSystem } from '../Utils/FileSystem.js';
import { Engine } from '../Core/Engine.js';

/**
 * Test file generator for the test generator tool
 */
class TestGenerator {
  /**
   * Create a new test generator
   * @param {Object} config - Configuration object
   * @param {Object} templateManager - Template manager instance
   */
  constructor(config, templateManager) {
    this.config = config;
    this.templateManager = templateManager;
    this.engine = new Engine();
  }

  /**
   * Generate a test file based on component requirements
   * @param {Object} requirements - Component requirements
   * @param {string} requirements.componentName - Name of the component
   * @param {string} requirements.category - Component category (e.g., 'admin/categories')
   * @param {string|string[]} requirements.testTypes - Types of tests to generate
   * @param {string|string[]} requirements.features - Component features
   * @param {Object[]} requirements.props - Component props
   * @param {Object} [options] - Generation options
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
   * @param {string} [options.outputDir] - Custom output directory for test files
   * @returns {Object} Result object with success status and generated files
   */
  generateTests(requirements, options = {}) {
    // Standardize and validate requirements
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

      // Determine which test types to generate
      let testTypesToGenerate = this._determineTestTypes(processedRequirements);
      
      // Generate each test type
      for (const testType of testTypesToGenerate) {
        const testResult = this._generateTestFile(processedRequirements, testType, options);
        
        if (testResult.success) {
          result.files.push(testResult.file);
        } else {
          result.success = false;
          result.errors.push(testResult.error);
        }
      }

      return result;
    } catch (error) {
      console.error(`Error generating tests: ${error.message}`);
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

    // Convert testTypes to array if it's a string
    if (typeof processed.testTypes === 'string') {
      processed.testTypes = processed.testTypes.split(',').map(t => t.trim());
    } else if (!Array.isArray(processed.testTypes)) {
      processed.testTypes = ['base'];
    }

    // Add component name in different cases
    processed.componentNameCamelCase = this._camelCase(processed.componentName);
    processed.componentNameKebabCase = this._kebabCase(processed.componentName);

    return processed;
  }

  /**
   * Determine which test types to generate based on requirements
   * @param {Object} requirements - Processed component requirements
   * @returns {string[]} Array of test types to generate
   * @private
   */
  _determineTestTypes(requirements) {
    const { testTypes, features } = requirements;
    
    // Start with explicitly specified test types
    let typesToGenerate = [...testTypes];
    
    // If no specific test types are requested, determine from features
    if (typesToGenerate.length === 1 && typesToGenerate[0] === 'base') {
      // Check each feature for related test types
      for (const feature of features) {
        const featureConfig = this.config.get(`features.${feature}`);
        if (featureConfig && featureConfig.relatedTestTypes) {
          // Add related test types from this feature
          typesToGenerate = [
            ...typesToGenerate,
            ...featureConfig.relatedTestTypes
          ];
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(typesToGenerate)];
  }

  /**
   * Generate a single test file for a specific test type
   * @param {Object} requirements - Component requirements
   * @param {string} testType - Type of test to generate
   * @param {Object} options - Generation options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateTestFile(requirements, testType, options) {
    try {
      // Get test type configuration
      const testTypeConfig = this.config.get(`testTypes.${testType}`);
      if (!testTypeConfig) {
        console.warn(`Unknown test type: ${testType}`);
        return {
          success: false,
          error: `Unknown test type: ${testType}`,
          file: null
        };
      }

      // Determine which template to use
      const templateName = testTypeConfig.template.replace('.template', '');
      
      // Try to get the specific template
      let template = this.templateManager.getTemplate(templateName);
      
      // Fall back to base template if specific one not found
      if (!template) {
        console.warn(`Template not found for test type: ${testType}, falling back to base template`);
        template = this.templateManager.getTemplate('base');
        
        // If even base template not found, fail
        if (!template) {
          throw new Error(`Template not found for test type: ${testType} and no base template found`);
        }
      }

      // Prepare data for template processing
      const data = this._prepareTemplateData(requirements, testType);

      // Process template
      const content = this.engine.generateContent(template.content, data);

      // Determine output path
      const outputPath = this._determineOutputPath(requirements, testType, options);

      // Create directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!FileSystem.directoryExists(outputDir)) {
        FileSystem.createDirectory(outputDir);
      }

      // Write the test file
      const writeResult = FileSystem.writeFile(
        outputPath, 
        content, 
        options.overwrite || false
      );

      if (!writeResult) {
        return {
          success: false,
          error: `Failed to write test file: ${outputPath}`,
          file: null
        };
      }

      console.log(`Successfully wrote file: ${outputPath}`);
      
      return {
        success: true,
        file: outputPath
      };
    } catch (error) {
      console.error(`Error generating test file for ${testType}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  /**
   * Prepare template data based on component requirements
   * @param {Object} requirements - Component requirements
   * @param {string} testType - Type of test being generated
   * @returns {Object} Template data
   * @private
   */
  _prepareTemplateData(requirements, testType) {
    const { componentName, componentNameCamelCase, componentNameKebabCase, category, features, props = [] } = requirements;
    
    // Basic template data
    const data = {
      componentName,
      componentNameCamelCase,
      componentNameKebabCase,
      category,
      testType,
      features,
      props,
      // Derived properties
      hasProps: props.length > 0,
      requiredProps: props.filter(prop => prop.required),
      optionalProps: props.filter(prop => !prop.required),
      testDescription: this.config.get(`testTypes.${testType}.description`, ''),
      // Helper functions for template use
      if: function(expr, options) {
        return expr ? options.fn(this) : options.inverse(this);
      }
    };

    // Add feature-specific data
    for (const feature of features) {
      const featureConfig = this.config.get(`features.${feature}`);
      if (featureConfig) {
        data[`has${this._pascalCase(feature)}`] = true;
        data[`${feature}Assertions`] = featureConfig.assertions || [];
      }
    }

    // Add category parts
    if (category) {
      const categoryParts = category.split('/');
      data.categoryParts = categoryParts;
      data.categoryPath = categoryParts.join('/');
      data.categoryName = categoryParts[categoryParts.length - 1];
    }

    // Generate test cases based on test type and features
    data.testCases = this._generateTestCases(requirements, testType);

    return data;
  }

  /**
   * Generate test cases based on component requirements and test type
   * @param {Object} requirements - Component requirements
   * @param {string} testType - Type of test being generated
   * @returns {string} Test cases content
   * @private
   */
  _generateTestCases(requirements, testType) {
    // For now, we'll rely on the templates to provide the test cases
    // as our templates already have detailed test cases
    return '';
  }

  /**
   * Determine the output path for a test file
   * @param {Object} requirements - Component requirements
   * @param {string} testType - Type of test being generated
   * @param {Object} options - Generation options
   * @returns {string} Output path
   * @private
   */
  _determineOutputPath(requirements, testType, options) {
    const { componentName, category } = requirements;
    
    // Get test type configuration
    const testTypeConfig = this.config.get(`testTypes.${testType}`);
    const suffix = testTypeConfig?.suffix || '.test.tsx';
    
    // Determine base output directory
    let outputDir = options.outputDir || this.config.get('paths.tests');
    
    // Add category subdirectories if provided
    if (category) {
      outputDir = path.join(outputDir, category);
    }
    
    // Create final filename
    const filename = `${componentName}${suffix}`;
    
    return path.join(outputDir, filename);
  }

  /**
   * Generate multiple test files at once
   * @param {Object[]} requirementsArray - Array of component requirements
   * @param {Object} options - Generation options
   * @returns {Object} Result object with success status and generated files
   */
  generateMultipleTests(requirementsArray, options = {}) {
    if (!Array.isArray(requirementsArray)) {
      return {
        success: false,
        error: 'Requirements array must be an array',
        files: []
      };
    }

    const result = {
      success: true,
      components: [],
      files: [],
      errors: []
    };

    for (const requirements of requirementsArray) {
      const componentResult = this.generateTests(requirements, options);
      
      result.components.push({
        componentName: requirements.componentName,
        success: componentResult.success,
        files: componentResult.files,
        errors: componentResult.errors || []
      });
      
      if (componentResult.success) {
        result.files = result.files.concat(componentResult.files);
      } else {
        result.success = false;
        result.errors = result.errors.concat(componentResult.errors || []);
      }
    }

    return result;
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
}

export { TestGenerator };
