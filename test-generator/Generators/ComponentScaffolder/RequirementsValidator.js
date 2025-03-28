/**
 * @fileoverview Requirements validator for component scaffolding.
 * Validates component requirements before scaffolding.
 */

/**
 * Requirements validator for component scaffolding
 */
class RequirementsValidator {
  /**
   * Create a new requirements validator
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
  }
  
  /**
   * Validate component requirements
   * @param {Object} requirements - Component requirements to validate
   * @returns {boolean} True if requirements are valid, false otherwise
   */
  validate(requirements) {
    if (!requirements) {
      console.error('No requirements provided');
      return false;
    }

    if (!requirements.componentName) {
      console.error('Missing required field: componentName');
      return false;
    }

    // Validate component name
    if (!this._validateComponentName(requirements.componentName)) {
      console.error(`Invalid component name: ${requirements.componentName}`);
      return false;
    }

    // Validate features
    if (requirements.features) {
      if (!this._validateFeatures(requirements.features)) {
        return false;
      }
    }

    // Validate props
    if (requirements.props) {
      if (!this._validateProps(requirements.props)) {
        return false;
      }
    }

    // Validate category
    if (requirements.category && !this._validateCategory(requirements.category)) {
      console.error(`Invalid category: ${requirements.category}`);
      return false;
    }

    return true;
  }
  
  /**
   * Validate component name
   * @param {string} componentName - Component name to validate
   * @returns {boolean} True if name is valid, false otherwise
   * @private
   */
  _validateComponentName(componentName) {
    if (typeof componentName !== 'string') {
      console.error('Component name must be a string');
      return false;
    }
    
    // Component name should be PascalCase
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
      console.error('Component name should be in PascalCase');
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate features
   * @param {string[]} features - Features to validate
   * @returns {boolean} True if features are valid, false otherwise
   * @private
   */
  _validateFeatures(features) {
    if (!Array.isArray(features)) {
      console.error('Features must be an array');
      return false;
    }
    
    const validFeatures = Object.keys(this.config.get('features', {}));
    
    for (const feature of features) {
      if (!validFeatures.includes(feature)) {
        console.warn(`Unknown feature: ${feature}`);
        // Don't fail validation for unknown features, just warn
      }
    }
    
    return true;
  }
  
  /**
   * Validate props
   * @param {Object[]} props - Props to validate
   * @returns {boolean} True if props are valid, false otherwise
   * @private
   */
  _validateProps(props) {
    if (!Array.isArray(props)) {
      console.error('Props must be an array');
      return false;
    }
    
    const validPropTypes = [
      'string', 
      'number', 
      'boolean', 
      'object', 
      'array', 
      'function', 
      'any',
      'React.ReactNode',
      'React.ReactElement'
    ];
    
    for (const prop of props) {
      if (!prop.name) {
        console.error('Each prop must have a name');
        return false;
      }
      
      if (prop.type && !validPropTypes.includes(prop.type)) {
        console.warn(`Unknown prop type: ${prop.type}`);
        // Don't fail validation for unknown prop types, just warn
      }
      
      if (prop.required !== undefined && typeof prop.required !== 'boolean') {
        console.error(`Required flag for ${prop.name} must be a boolean`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate category
   * @param {string} category - Category to validate
   * @returns {boolean} True if category is valid, false otherwise
   * @private
   */
  _validateCategory(category) {
    if (typeof category !== 'string') {
      console.error('Category must be a string');
      return false;
    }
    
    // Category should only contain allowed characters
    if (!/^[a-zA-Z0-9/\-_]+$/.test(category)) {
      console.error('Category should only contain letters, numbers, slashes, hyphens, and underscores');
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate requirements from a file
   * @param {string} filePath - Path to requirements file
   * @returns {Object} Validation result with status and requirements
   */
  validateFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const requirements = JSON.parse(content);
      
      const isValid = this.validate(requirements);
      
      return {
        valid: isValid,
        requirements: isValid ? requirements : null,
        error: isValid ? null : 'Invalid requirements'
      };
    } catch (error) {
      console.error(`Error validating requirements file: ${error.message}`);
      
      return {
        valid: false,
        requirements: null,
        error: error.message
      };
    }
  }
}

export default RequirementsValidator;
