/**
 * @fileoverview Props generator for component scaffolding.
 * Handles generation of TypeScript interfaces and default props.
 */

/**
 * Props generator for component scaffolding
 */
class PropsGenerator {
  /**
   * Generate props interface based on component props
   * @param {Object[]} props - Component props
   * @param {string} componentName - Name of the component
   * @returns {string} Props interface definition
   */
  generateInterface(props, componentName) {
    if (!props || props.length === 0) {
      return `export interface ${componentName}Props {}\n`;
    }

    let interfaceStr = `export interface ${componentName}Props {\n`;
    
    for (const prop of props) {
      const required = prop.required ? '' : '?';
      let type = prop.type || 'any';
      
      // Handle function props
      if (type === 'function') {
        const params = prop.params || [];
        const returnType = prop.returnType || 'void';
        
        // Generate function type
        if (params.length > 0) {
          const paramsStr = params.map(p => `${p.name}: ${p.type || 'any'}`).join(', ');
          type = `(${paramsStr}) => ${returnType}`;
        } else {
          type = `() => ${returnType}`;
        }
      }
      
      // Add JSDoc comment if description exists
      if (prop.description) {
        interfaceStr += `  /**\n   * ${prop.description}\n   */\n`;
      }
      
      // Add prop definition
      interfaceStr += `  ${prop.name}${required}: ${type};\n`;
    }
    
    interfaceStr += `}\n`;
    
    return interfaceStr;
  }

  /**
   * Generate default props based on component props
   * @param {Object[]} props - Component props
   * @returns {string} Default props object
   */
  generateDefaultProps(props) {
    if (!props || props.length === 0) {
      return '';
    }

    const defaultProps = props.filter(prop => prop.defaultValue !== undefined);
    
    if (defaultProps.length === 0) {
      return '';
    }

    let defaultPropsStr = `const defaultProps = {\n`;
    
    for (const prop of defaultProps) {
      let value = prop.defaultValue;
      
      // Handle string values
      if (typeof value === 'string') {
        value = `'${value}'`;
      }
      
      // Handle function values
      if (prop.type === 'function') {
        value = '() => {}';
      }
      
      defaultPropsStr += `  ${prop.name}: ${value},\n`;
    }
    
    defaultPropsStr += `};\n\n`;
    
    return defaultPropsStr;
  }

  /**
   * Generate destructuring statement for props
   * @param {Object[]} props - Component props
   * @returns {string} Props destructuring statement
   */
  generatePropsDestructuring(props) {
    if (!props || props.length === 0) {
      return 'const {} = props;';
    }

    const propNames = props.map(prop => prop.name);
    return `const { ${propNames.join(', ')} } = props;`;
  }

  /**
   * Generate prop types validation
   * @param {Object[]} props - Component props
   * @param {string} componentName - Name of the component
   * @returns {string} PropTypes validation code
   */
  generatePropTypes(props, componentName) {
    if (!props || props.length === 0) {
      return '';
    }

    let propTypesStr = `${componentName}.propTypes = {\n`;
    
    for (const prop of props) {
      let propTypeValue = 'PropTypes.any';
      
      // Map type to PropTypes
      switch (prop.type) {
        case 'string':
          propTypeValue = 'PropTypes.string';
          break;
        case 'number':
          propTypeValue = 'PropTypes.number';
          break;
        case 'boolean':
          propTypeValue = 'PropTypes.bool';
          break;
        case 'function':
          propTypeValue = 'PropTypes.func';
          break;
        case 'object':
          propTypeValue = 'PropTypes.object';
          break;
        case 'array':
          propTypeValue = 'PropTypes.array';
          break;
        default:
          propTypeValue = 'PropTypes.any';
      }
      
      // Add isRequired if prop is required
      if (prop.required) {
        propTypeValue += '.isRequired';
      }
      
      propTypesStr += `  ${prop.name}: ${propTypeValue},\n`;
    }
    
    propTypesStr += `};\n\n`;
    
    return propTypesStr;
  }
}

export default PropsGenerator;
