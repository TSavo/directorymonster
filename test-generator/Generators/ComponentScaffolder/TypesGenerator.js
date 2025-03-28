/**
 * @fileoverview Types generator for component scaffolding.
 * Handles generation of TypeScript type definitions.
 */

/**
 * Types generator for component scaffolding
 */
class TypesGenerator {
  /**
   * Create a new types generator
   * @param {Object} engine - Template engine instance
   */
  constructor(engine) {
    this.engine = engine;
  }
  
  /**
   * Generate types content
   * @param {string} templateContent - Template content
   * @param {Object} data - Template data
   * @returns {string} Generated types content
   */
  generate(templateContent, data) {
    // If no template is provided, generate basic types
    if (!templateContent) {
      return this._generateBasicTypes(data);
    }
    
    // Process template with engine
    return this.engine.process(templateContent, data);
  }
  
  /**
   * Generate basic types without a template
   * @param {Object} data - Component data
   * @returns {string} Generated types content
   * @private
   */
  _generateBasicTypes(data) {
    const { componentName, props = [], features = [] } = data;
    
    let content = '';
    
    // Add any necessary imports
    if (features.includes('data-loading') || features.includes('pagination')) {
      content += `// Types for ${componentName} component\n\n`;
    }
    
    // Add props interface
    content += `/**\n * Props for the ${componentName} component\n */\n`;
    content += `export interface ${componentName}Props {\n`;
    
    for (const prop of props) {
      const required = prop.required ? '' : '?';
      let type = prop.type || 'any';
      
      // Handle function props
      if (type === 'function') {
        const params = prop.params || [];
        const returnType = prop.returnType || 'void';
        
        if (params.length > 0) {
          const paramsStr = params.map(p => `${p.name}: ${p.type || 'any'}`).join(', ');
          type = `(${paramsStr}) => ${returnType}`;
        } else {
          type = `() => ${returnType}`;
        }
      }
      
      // Add JSDoc comment if description exists
      if (prop.description) {
        content += `  /**\n   * ${prop.description}\n   */\n`;
      }
      
      content += `  ${prop.name}${required}: ${type};\n`;
    }
    
    content += `}\n\n`;
    
    // Add any feature-specific types
    if (features.includes('data-loading')) {
      content += `/**\n * Loading state for ${componentName}\n */\n`;
      content += `export type LoadingState = 'idle' | 'loading' | 'success' | 'error';\n\n`;
    }
    
    if (features.includes('sorting')) {
      content += `/**\n * Sort direction for ${componentName}\n */\n`;
      content += `export type SortDirection = 'asc' | 'desc';\n\n`;
      
      content += `/**\n * Sort field for ${componentName}\n */\n`;
      content += `export type SortField = string | null;\n\n`;
    }
    
    if (features.includes('pagination')) {
      content += `/**\n * Pagination state for ${componentName}\n */\n`;
      content += `export interface PaginationState {\n`;
      content += `  page: number;\n`;
      content += `  pageSize: number;\n`;
      content += `  totalItems: number;\n`;
      content += `  totalPages: number;\n`;
      content += `}\n\n`;
    }
    
    if (features.includes('filtering')) {
      content += `/**\n * Filter state for ${componentName}\n */\n`;
      content += `export interface FilterState {\n`;
      content += `  searchTerm: string;\n`;
      content += `  filters: Record<string, string | number | boolean | null>;\n`;
      content += `}\n\n`;
    }
    
    return content;
  }
  
  /**
   * Generate enum type definition
   * @param {string} name - Enum name
   * @param {string[]} values - Enum values
   * @param {string} [description] - Optional description
   * @returns {string} Enum type definition
   */
  generateEnum(name, values, description) {
    let enumStr = '';
    
    if (description) {
      enumStr += `/**\n * ${description}\n */\n`;
    }
    
    enumStr += `export enum ${name} {\n`;
    
    for (const value of values) {
      enumStr += `  ${value} = '${value}',\n`;
    }
    
    enumStr += `}\n\n`;
    
    return enumStr;
  }
  
  /**
   * Generate union type definition
   * @param {string} name - Type name
   * @param {string[]} values - Union values
   * @param {string} [description] - Optional description
   * @returns {string} Union type definition
   */
  generateUnionType(name, values, description) {
    let unionStr = '';
    
    if (description) {
      unionStr += `/**\n * ${description}\n */\n`;
    }
    
    const formattedValues = values.map(v => `'${v}'`).join(' | ');
    unionStr += `export type ${name} = ${formattedValues};\n\n`;
    
    return unionStr;
  }
  
  /**
   * Generate model interface definition
   * @param {string} name - Interface name
   * @param {Object} fields - Interface fields with types
   * @param {string} [description] - Optional description
   * @returns {string} Interface definition
   */
  generateInterface(name, fields, description) {
    let interfaceStr = '';
    
    if (description) {
      interfaceStr += `/**\n * ${description}\n */\n`;
    }
    
    interfaceStr += `export interface ${name} {\n`;
    
    for (const [fieldName, fieldType] of Object.entries(fields)) {
      interfaceStr += `  ${fieldName}: ${fieldType};\n`;
    }
    
    interfaceStr += `}\n\n`;
    
    return interfaceStr;
  }
}

export default TypesGenerator;
