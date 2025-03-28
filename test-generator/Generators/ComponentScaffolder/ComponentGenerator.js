/**
 * @fileoverview Component generator for component scaffolding.
 * Handles generation of React component code.
 */

/**
 * Component generator for component scaffolding
 */
class ComponentGenerator {
  /**
   * Create a new component generator
   * @param {Object} engine - Template engine instance
   */
  constructor(engine) {
    this.engine = engine;
  }
  
  /**
   * Generate component content
   * @param {string} templateContent - Template content
   * @param {Object} data - Template data
   * @returns {string} Generated component content
   */
  generate(templateContent, data) {
    // If no template is provided, generate a basic component
    if (!templateContent) {
      return this._generateBasicComponent(data);
    }
    
    // Process template with engine
    return this.engine.process(templateContent, data);
  }
  
  /**
   * Generate a basic component without a template
   * @param {Object} data - Component data
   * @returns {string} Generated component content
   * @private
   */
  _generateBasicComponent(data) {
    const { 
      componentName, 
      imports, 
      propsInterface,
      defaultProps, 
      features = [], 
      props = [] 
    } = data;
    
    let content = `${imports || 'import React from \'react\';'}\n\n`;
    
    // Add props interface if not provided separately
    if (!data.hasTypes && propsInterface) {
      content += `${propsInterface}\n`;
    } else if (!data.hasTypes) {
      content += `export interface ${componentName}Props {\n`;
      
      for (const prop of props) {
        const required = prop.required ? '' : '?';
        content += `  ${prop.name}${required}: ${prop.type || 'any'};\n`;
      }
      
      content += `}\n\n`;
    } else {
      content += `import { ${componentName}Props } from './types';\n\n`;
    }
    
    // Add default props if any
    if (defaultProps) {
      content += `${defaultProps}\n`;
    }
    
    // Start component function
    content += `/**\n * ${componentName} component\n`;
    if (data.description) {
      content += ` * ${data.description}\n`;
    }
    content += ` */\nconst ${componentName} = (props: ${componentName}Props) => {\n`;
    
    // Add state hooks based on features
    if (features.includes('data-loading')) {
      content += `  const [isLoading, setIsLoading] = useState(false);\n`;
    }
    
    if (features.includes('errors')) {
      content += `  const [error, setError] = useState<string | null>(null);\n`;
    }
    
    if (features.includes('form')) {
      content += `  const [isSubmitting, setIsSubmitting] = useState(false);\n`;
    }
    
    if (features.includes('sorting')) {
      content += `  const [sortField, setSortField] = useState<string | null>(null);\n`;
      content += `  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');\n`;
    }
    
    // Props destructuring
    if (props.length > 0) {
      const propNames = props.map(p => p.name);
      content += `\n  const { ${propNames.join(', ')} } = props;\n`;
    }
    
    // Add handlers based on features
    if (features.includes('form')) {
      content += `\n  const handleSubmit = () => {\n    // Handle form submission\n  };\n`;
    }
    
    if (features.includes('interaction')) {
      content += `\n  const handleClick = () => {\n    // Handle click event\n  };\n`;
    }
    
    if (features.includes('sorting')) {
      content += `\n  const handleSort = (field: string) => {\n    // Handle sorting\n  };\n`;
    }
    
    // Return statement with appropriate content based on features
    content += `\n  return (\n`;
    content += `    <div data-testid="${componentName.toLowerCase()}">\n`;
    
    // Add conditional rendering based on features
    if (features.includes('data-loading')) {
      content += `      {isLoading ? (\n`;
      content += `        <Spinner />\n`;
      content += `      ) : (\n`;
      content += `        // Component content\n`;
      content += `        <div>${componentName} content</div>\n`;
      content += `      )}\n`;
    } else if (features.includes('errors')) {
      content += `      {error ? (\n`;
      content += `        <Alert variant="destructive">\n`;
      content += `          <AlertTitle>Error</AlertTitle>\n`;
      content += `          <AlertDescription>{error}</AlertDescription>\n`;
      content += `        </Alert>\n`;
      content += `      ) : (\n`;
      content += `        // Component content\n`;
      content += `        <div>${componentName} content</div>\n`;
      content += `      )}\n`;
    } else if (features.includes('form')) {
      content += `      <Form onSubmit={handleSubmit}>\n`;
      content += `        <FormField name="example">\n`;
      content += `          <FormLabel>Example Field</FormLabel>\n`;
      content += `          <Input name="example" />\n`;
      content += `          <FormMessage />\n`;
      content += `        </FormField>\n`;
      content += `        <Button type="submit" disabled={isSubmitting}>\n`;
      content += `          Submit\n`;
      content += `        </Button>\n`;
      content += `      </Form>\n`;
    } else {
      content += `      <div>${componentName} content</div>\n`;
    }
    
    content += `    </div>\n`;
    content += `  );\n`;
    content += `};\n\n`;
    
    // Add React.memo if performance optimization is needed
    if (features.includes('performance')) {
      content += `export default React.memo(${componentName});\n`;
    } else {
      content += `export default ${componentName};\n`;
    }
    
    return content;
  }
  
  /**
   * Generate JSDoc for a component
   * @param {Object} data - Component data
   * @returns {string} JSDoc comment block
   */
  generateJSDoc(data) {
    const { componentName, description, props = [] } = data;
    
    let jsDoc = `/**\n * ${componentName} component\n`;
    
    if (description) {
      jsDoc += ` * ${description}\n *\n`;
    }
    
    // Add param tags for each prop
    if (props.length > 0) {
      jsDoc += ` * @param {object} props - Component props\n`;
      
      for (const prop of props) {
        let type = prop.type || 'any';
        
        // Format the type for JSDoc
        if (type === 'array') {
          type = 'Array';
        } else if (type === 'object') {
          type = 'Object';
        } else {
          type = type.charAt(0).toUpperCase() + type.slice(1);
        }
        
        jsDoc += ` * @param {${type}} props.${prop.name}`;
        
        if (prop.description) {
          jsDoc += ` - ${prop.description}`;
        }
        
        jsDoc += `\n`;
      }
    }
    
    jsDoc += ` * @returns {JSX.Element} The ${componentName} component\n`;
    jsDoc += ` */\n`;
    
    return jsDoc;
  }
}

export default ComponentGenerator;
