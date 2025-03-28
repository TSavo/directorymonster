/**
 * @fileoverview Component scaffolder module for the test generator.
 * Creates component stubs that satisfy test requirements.
 */

import path from 'path';
import FileSystem from '../Utils/FileSystem.js';
import Engine from '../Core/Engine.js';
import PropsGenerator from './ComponentScaffolder/PropsGenerator.js';
import ImportsGenerator from './ComponentScaffolder/ImportsGenerator.js';
import ComponentGenerator from './ComponentScaffolder/ComponentGenerator.js';
import TypesGenerator from './ComponentScaffolder/TypesGenerator.js';
import RequirementsValidator from './ComponentScaffolder/RequirementsValidator.js';

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
    
    // Initialize sub-generators
    this.propsGenerator = new PropsGenerator();
    this.importsGenerator = new ImportsGenerator();
    this.componentGenerator = new ComponentGenerator(this.engine);
    this.typesGenerator = new TypesGenerator(this.engine);
    this.requirementsValidator = new RequirementsValidator(config);
  }

  /**
   * Scaffold a component based on requirements
   * @param {Object} requirements - Component requirements
   * @param {string} requirements.componentName - Name of the component
   * @param {string} requirements.category - Component category (e.g., 'admin/categories')
   * @param {string[]} requirements.features - Component features
   * @param {Object[]} requirements.props - Component props
   * @param {Object} [options] - Scaffolding options
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
   * @param {string} [options.outputDir] - Custom output directory for component files
   * @returns {Object} Result object with success status and generated files
   */
  scaffoldComponent(requirements, options = {}) {
    if (!this.requirementsValidator.validate(requirements)) {
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
      const componentResult = this._generateComponentFile(requirements, options);
      if (componentResult.success) {
        result.files.push(componentResult.file);
      } else {
        result.success = false;
        result.errors.push(componentResult.error);
      }

      // Generate types file if needed
      if (requirements.props && requirements.props.length > 0) {
        const typesResult = this._generateTypesFile(requirements, options);
        if (typesResult.success) {
          result.files.push(typesResult.file);
        } else {
          result.errors.push(typesResult.error);
        }
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
   * Generate a component file based on requirements
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Scaffolding options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateComponentFile(requirements, options) {
    try {
      // Get template for component
      const template = this.templateManager.getTemplate('component');
      if (!template) {
        throw new Error('Component template not found');
      }

      // Prepare data for template processing
      const data = this._prepareTemplateData(requirements);

      // Generate component content
      const content = this.componentGenerator.generate(template.content, data);

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
      console.error(`Error generating component file: ${error.message}`);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  /**
   * Generate a types file for the component
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Scaffolding options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateTypesFile(requirements, options) {
    try {
      // Get template for types
      const template = this.templateManager.getTemplate('types');
      if (!template) {
        throw new Error('Types template not found');
      }

      // Prepare data for template processing
      const data = this._prepareTemplateData(requirements);

      // Generate types content
      const content = this.typesGenerator.generate(template.content, data);

      // Determine output path
      const componentPath = this._determineComponentPath(requirements, options);
      const outputDir = path.dirname(componentPath);
      const outputPath = path.join(outputDir, 'types.ts');

      // Create directory if it doesn't exist
      if (!FileSystem.directoryExists(outputDir)) {
        FileSystem.createDirectory(outputDir);
      }

      // Write the types file
      const writeResult = FileSystem.writeFile(
        outputPath, 
        content, 
        options.overwrite || false
      );

      if (!writeResult) {
        return {
          success: false,
          error: `Failed to write types file: ${outputPath}`,
          file: null
        };
      }

      return {
        success: true,
        file: outputPath
      };
    } catch (error) {
      console.error(`Error generating types file: ${error.message}`);
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
   * @returns {Object} Template data
   * @private
   */
  _prepareTemplateData(requirements) {
    const { componentName, category, features = [], props = [] } = requirements;

    // Basic template data
    const data = {
      componentName,
      category,
      features,
      props,
      // Derived properties
      hasProps: props.length > 0,
      requiredProps: props.filter(prop => prop.required),
      optionalProps: props.filter(prop => !prop.required),
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
      }
    }

    // Generate props interface
    data.propsInterface = this.propsGenerator.generateInterface(props, componentName);
    
    // Generate default props
    data.defaultProps = this.propsGenerator.generateDefaultProps(props);
    
    // Generate imports
    data.imports = this.importsGenerator.generate(features, props);

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
    
    // Create final filename
    const filename = `${componentName}.tsx`;
    
    return path.join(outputDir, filename);
  }

  /**
   * Scaffold a component from existing tests
   * @param {string} testFilePath - Path to the test file
   * @param {Object} options - Scaffolding options
   * @returns {Object} Result object with success status and generated files
   */
  scaffoldFromTests(testFilePath, options = {}) {
    try {
      // Check if test file exists
      if (!FileSystem.fileExists(testFilePath)) {
        return {
          success: false,
          error: `Test file not found: ${testFilePath}`,
          files: []
        };
      }

      // Read test file
      const testContent = FileSystem.readFile(testFilePath);
      if (!testContent) {
        return {
          success: false,
          error: `Failed to read test file: ${testFilePath}`,
          files: []
        };
      }

      // Extract component name from test file
      const componentNameMatch = testContent.match(/describe\(['"](.+?)(?:\s+Component)?['"]/);
      if (!componentNameMatch) {
        return {
          success: false,
          error: 'Could not determine component name from test file',
          files: []
        };
      }

      const componentName = componentNameMatch[1];

      // Extract category from test file path
      let category = '';
      const testsPath = this.config.get('paths.tests');
      const relativePath = path.relative(testsPath, path.dirname(testFilePath));
      if (relativePath && relativePath !== '.') {
        category = relativePath;
      }

      // Extract features and props from tests (basic implementation)
      const features = this._extractFeaturesFromTests(testContent);
      const props = this._extractPropsFromTests(testContent);

      // Create requirements object
      const requirements = {
        componentName,
        category,
        features,
        props
      };

      // Scaffold the component using the extracted requirements
      return this.scaffoldComponent(requirements, options);
    } catch (error) {
      console.error(`Error scaffolding from tests: ${error.message}`);
      return {
        success: false,
        error: error.message,
        files: []
      };
    }
  }

  /**
   * Extract features from test content
   * @param {string} testContent - Test file content
   * @returns {string[]} Extracted features
   * @private
   */
  _extractFeaturesFromTests(testContent) {
    const features = [];
    
    // Common patterns to detect features
    const featurePatterns = {
      'loading': /loading state|isLoading|spinner/i,
      'errors': /error message|displays error|errorState/i,
      'form': /form submission|validates form|submits form/i,
      'sorting': /sort direction|toggles sort|sorting state/i,
      'hierarchy': /parent-child|hierarchical|tree structure/i,
      'pagination': /page navigation|pagination controls|items per page/i,
      'keyboard': /keyboard navigation|focus management|tab order/i,
      'interaction': /click event|hover state|user interaction/i
    };
    
    // Check for each feature pattern
    for (const [feature, pattern] of Object.entries(featurePatterns)) {
      if (pattern.test(testContent)) {
        features.push(feature);
      }
    }
    
    return features;
  }

  /**
   * Extract props from test content
   * @param {string} testContent - Test file content
   * @returns {Object[]} Extracted props
   * @private
   */
  _extractPropsFromTests(testContent) {
    const props = [];
    
    // Extract prop names from render calls
    const renderProps = testContent.match(/render\(\s*<\w+\s+([^>]+)>/g);
    if (renderProps) {
      for (const renderProp of renderProps) {
        const propMatches = renderProp.match(/(\w+)(?:=|\s*:\s*)/g);
        if (propMatches) {
          for (const propMatch of propMatches) {
            const propName = propMatch.replace(/[=:\s]/g, '');
            if (propName && !props.some(p => p.name === propName)) {
              // Try to infer prop type
              let type = 'any';
              if (testContent.includes(`${propName}={true}`) || testContent.includes(`${propName}={false}`)) {
                type = 'boolean';
              } else if (testContent.includes(`${propName}={[`) || testContent.includes(`${propName}={mockArray`)) {
                type = 'array';
              } else if (testContent.includes(`${propName}={mock`) || testContent.includes(`${propName}={jest.fn`)) {
                type = 'function';
              } else if (testContent.includes(`${propName}="`) || testContent.includes(`${propName}={'`)) {
                type = 'string';
              } else if (testContent.includes(`${propName}={123`) || testContent.includes(`${propName}={mockNumber`)) {
                type = 'number';
              } else if (testContent.includes(`${propName}={{`)) {
                type = 'object';
              }
              
              props.push({
                name: propName,
                type,
                required: testContent.includes(`required prop`) && testContent.includes(propName)
              });
            }
          }
        }
      }
    }
    
    return props;
  }
}

export default ComponentScaffolder;
