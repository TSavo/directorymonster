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
   * @param {string[]} requirements.testTypes - Types of tests to generate
   * @param {string[]} requirements.features - Component features
   * @param {Object[]} requirements.props - Component props
   * @param {Object} [options] - Generation options
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
   * @param {string} [options.outputDir] - Custom output directory for test files
   * @returns {Object} Result object with success status and generated files
   */
  generateTests(requirements, options = {}) {
    if (!this._validateRequirements(requirements)) {
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

      const testTypes = requirements.testTypes || ['base'];
      
      for (const testType of testTypes) {
        const testResult = this._generateTestFile(requirements, testType, options);
        
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
        throw new Error(`Unknown test type: ${testType}`);
      }

      // Get template for this test type
      const template = this.templateManager.getTemplate(testType);
      if (!template) {
        throw new Error(`Template not found for test type: ${testType}`);
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
    const { componentName, category, props = [] } = requirements;
    
    // Convert features to array if it's a string
    let features = requirements.features || [];
    if (typeof features === 'string') {
      features = features.split(',');
    }

    // Basic template data
    const data = {
      componentName,
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
      helpers: {
        camelCase: s => s.charAt(0).toLowerCase() + s.slice(1),
        pascalCase: s => s.charAt(0).toUpperCase() + s.slice(1),
        kebabCase: s => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
      }
    };

    // Add feature-specific data
    for (const feature of features) {
      const featureConfig = this.config.get(`features.${feature}`);
      if (featureConfig) {
        data[`has${feature.charAt(0).toUpperCase()}${feature.slice(1)}`] = true;
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
    const { componentName, features = [] } = requirements;

    // Basic test case for rendering
    let testCases = `
  it('renders ${componentName} component', () => {
    // Test component rendering
  });
`;

    // Add test type specific test cases
    switch (testType) {
      case 'base':
        // Add props test cases
        if (requirements.props && requirements.props.length > 0) {
          testCases += `
  it('renders with required props', () => {
    // Test with required props
  });

  it('renders with all props', () => {
    // Test with all props
  });
`;
        }

        // Add state test cases
        if (features.includes('data-loading')) {
          testCases += `
  it('displays loading state when isLoading is true', () => {
    // Test loading state
  });
`;
        }

        if (features.includes('errors')) {
          testCases += `
  it('displays error message when there is an error', () => {
    // Test error state
  });
`;
        }
        break;

      case 'actions':
        // Add interaction test cases
        if (features.includes('interaction')) {
          testCases += `
  it('handles click events', () => {
    // Test click event handling
  });
`;
        }

        // Add form test cases
        if (features.includes('form')) {
          testCases += `
  it('submits form with valid data', () => {
    // Test form submission
  });

  it('validates form data before submission', () => {
    // Test form validation
  });
`;
        }
        break;

      case 'hierarchy':
        // Add hierarchy test cases
        if (features.includes('hierarchy')) {
          testCases += `
  it('displays parent-child relationships correctly', () => {
    // Test parent-child hierarchy display
  });

  it('indents child items properly', () => {
    // Test indentation based on depth
  });
`;
        }
        break;

      case 'sorting':
        // Add sorting test cases
        if (features.includes('sorting')) {
          testCases += `
  it('indicates the current sort field', () => {
    // Test sort field indicator
  });

  it('toggles between ascending and descending sort', () => {
    // Test sort direction toggle
  });

  it('updates sort state when column header is clicked', () => {
    // Test sort state update on click
  });
`;
        }
        break;

      case 'accessibility':
        // Add accessibility test cases
        testCases += `
  it('has proper ARIA attributes', () => {
    // Test ARIA attribute presence
  });
`;

        if (features.includes('keyboard')) {
          testCases += `
  it('supports keyboard navigation', () => {
    // Test keyboard navigation
  });

  it('maintains proper focus states', () => {
    // Test focus management
  });
`;
        }
        break;
    }

    return testCases;
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
   * Validate component requirements
   * @param {Object} requirements - Component requirements to validate
   * @returns {boolean} True if requirements are valid, false otherwise
   * @private
   */
  _validateRequirements(requirements) {
    if (!requirements) {
      console.error('No requirements provided');
      return false;
    }

    if (!requirements.componentName) {
      console.error('Missing required field: componentName');
      return false;
    }

    // Validate test types
    if (requirements.testTypes) {
      for (const testType of requirements.testTypes) {
        if (!this.config.get(`testTypes.${testType}`)) {
          console.error(`Unknown test type: ${testType}`);
          return false;
        }
      }
    }

    // Validate features
    if (requirements.features) {
      // Handle if features is a string (comma-separated list)
      if (typeof requirements.features === 'string') {
        requirements.features = requirements.features.split(',');
      }
      
      // Validate each feature
      if (Array.isArray(requirements.features)) {
        for (const feature of requirements.features) {
          if (!this.config.get(`features.${feature}`)) {
            console.warn(`Unknown feature: ${feature}`);
            // Don't fail validation for unknown features, just warn
          }
        }
      }
    }

    // Validate props
    if (requirements.props) {
      if (!Array.isArray(requirements.props)) {
        console.error('Props must be an array');
        return false;
      }

      for (const prop of requirements.props) {
        if (!prop.name) {
          console.error('Each prop must have a name');
          return false;
        }
      }
    }

    return true;
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
}

export { TestGenerator };
