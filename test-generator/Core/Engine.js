/**
 * @fileoverview Template processing engine for the test generator.
 * Handles variable substitution, conditional logic, and content generation.
 */

/**
 * Template processing engine for the test generator
 */
class Engine {
  /**
   * Create a new template engine
   * @param {Object} options - Engine options
   * @param {string} [options.variablePattern=/{([^{}]+)}/g] - Regex pattern for variables
   * @param {string} [options.conditionStartPattern=/{if ([^{}]+)}/g] - Regex pattern for condition start
   * @param {string} [options.conditionElsePattern=/{else}/g] - Regex pattern for condition else
   * @param {string} [options.conditionEndPattern=/{\/if}/g] - Regex pattern for condition end
   * @param {string} [options.loopStartPattern=/{for ([^{}]+) in ([^{}]+)}/g] - Regex pattern for loop start
   * @param {string} [options.loopEndPattern=/{\/for}/g] - Regex pattern for loop end
   */
  constructor(options = {}) {
    this.options = {
      variablePattern: /{([^{}]+)}/g,
      conditionStartPattern: /{if ([^{}]+)}/g,
      conditionElsePattern: /{else}/g,
      conditionEndPattern: /{\/if}/g,
      loopStartPattern: /{for ([^{}]+) in ([^{}]+)}/g,
      loopEndPattern: /{\/for}/g,
      ...options
    };
  }

  /**
   * Process a template with variable substitution and conditional logic
   * @param {string} template - Template string to process
   * @param {Object} variables - Variables to use for substitution
   * @returns {string} Processed template
   */
  process(template, variables) {
    if (!template) {
      console.error('No template provided for processing');
      return '';
    }

    if (!variables || typeof variables !== 'object') {
      console.error('Invalid variables object for template processing');
      return template;
    }

    try {
      // Process conditionals
      let processedTemplate = this._processConditionals(template, variables);
      
      // Process loops
      processedTemplate = this._processLoops(processedTemplate, variables);
      
      // Process variable substitution
      processedTemplate = this._processVariables(processedTemplate, variables);
      
      return processedTemplate;
    } catch (error) {
      console.error(`Error processing template: ${error.message}`);
      return template;
    }
  }

  /**
   * Process variable substitution in a template
   * @param {string} template - Template string to process
   * @param {Object} variables - Variables to use for substitution
   * @returns {string} Processed template with variables substituted
   * @private
   */
  _processVariables(template, variables) {
    return template.replace(this.options.variablePattern, (match, varName) => {
      const varPath = varName.trim().split('.');
      let value = variables;
      
      // Traverse the variable path
      for (const key of varPath) {
        if (value === undefined || value === null) {
          return match; // Keep original if path is invalid
        }
        value = value[key.trim()];
      }
      
      if (value === undefined || value === null) {
        return match; // Keep original if value is null or undefined
      }
      
      return String(value);
    });
  }

  /**
   * Process conditional logic in a template
   * @param {string} template - Template string to process
   * @param {Object} variables - Variables to use for evaluation
   * @returns {string} Processed template with conditionals evaluated
   * @private
   */
  _processConditionals(template, variables) {
    // Find all conditional blocks
    const conditionRegex = new RegExp(
      '{if ([^{}]+)}([\\s\\S]*?)(?:{else}([\\s\\S]*?))?{/if}',
      'g'
    );
    
    return template.replace(conditionRegex, (match, condition, ifBlock, elseBlock = '') => {
      try {
        const conditionResult = this._evaluateCondition(condition, variables);
        return conditionResult ? ifBlock : elseBlock;
      } catch (error) {
        console.error(`Error evaluating condition "${condition}": ${error.message}`);
        return match; // Keep original on error
      }
    });
  }

  /**
   * Process loop logic in a template
   * @param {string} template - Template string to process
   * @param {Object} variables - Variables to use for evaluation
   * @returns {string} Processed template with loops evaluated
   * @private
   */
  _processLoops(template, variables) {
    // Find all loop blocks
    const loopRegex = new RegExp(
      '{for ([^{}]+) in ([^{}]+)}([\\s\\S]*?){/for}',
      'g'
    );
    
    return template.replace(loopRegex, (match, itemVar, arrayVar, loopBlock) => {
      try {
        const arrayPath = arrayVar.trim().split('.');
        let array = variables;
        
        // Traverse the array path
        for (const key of arrayPath) {
          if (array === undefined || array === null) {
            return ''; // Empty string if path is invalid
          }
          array = array[key.trim()];
        }
        
        if (!Array.isArray(array)) {
          console.error(`Loop variable "${arrayVar}" is not an array`);
          return '';
        }
        
        let result = '';
        for (const item of array) {
          // Create a new scope with the loop variable
          const loopVariables = {
            ...variables,
            [itemVar.trim()]: item,
            index: array.indexOf(item)
          };
          
          // Process the loop block with the new scope
          let processedBlock = this._processVariables(loopBlock, loopVariables);
          processedBlock = this._processConditionals(processedBlock, loopVariables);
          
          result += processedBlock;
        }
        
        return result;
      } catch (error) {
        console.error(`Error processing loop: ${error.message}`);
        return match; // Keep original on error
      }
    });
  }

  /**
   * Evaluate a condition expression
   * @param {string} condition - Condition expression to evaluate
   * @param {Object} variables - Variables to use for evaluation
   * @returns {boolean} Result of the condition evaluation
   * @private
   */
  _evaluateCondition(condition, variables) {
    condition = condition.trim();
    
    // Simple condition formats
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map(s => s.trim());
      return this._getVariableValue(left, variables) == this._getVariableValue(right, variables);
    } else if (condition.includes('!=')) {
      const [left, right] = condition.split('!=').map(s => s.trim());
      return this._getVariableValue(left, variables) != this._getVariableValue(right, variables);
    } else if (condition.includes('>=')) {
      const [left, right] = condition.split('>=').map(s => s.trim());
      return this._getVariableValue(left, variables) >= this._getVariableValue(right, variables);
    } else if (condition.includes('<=')) {
      const [left, right] = condition.split('<=').map(s => s.trim());
      return this._getVariableValue(left, variables) <= this._getVariableValue(right, variables);
    } else if (condition.includes('>')) {
      const [left, right] = condition.split('>').map(s => s.trim());
      return this._getVariableValue(left, variables) > this._getVariableValue(right, variables);
    } else if (condition.includes('<')) {
      const [left, right] = condition.split('<').map(s => s.trim());
      return this._getVariableValue(left, variables) < this._getVariableValue(right, variables);
    } else if (condition.startsWith('!')) {
      const varName = condition.substring(1).trim();
      return !this._getVariableValue(varName, variables);
    } else {
      // Simple existence check
      return Boolean(this._getVariableValue(condition, variables));
    }
  }

  /**
   * Get the value of a variable from the variables object
   * @param {string} varExpr - Variable expression (can be a path or literal)
   * @param {Object} variables - Variables object
   * @returns {*} Value of the variable
   * @private
   */
  _getVariableValue(varExpr, variables) {
    varExpr = varExpr.trim();
    
    // Handle string literals
    if (varExpr.startsWith('"') && varExpr.endsWith('"')) {
      return varExpr.slice(1, -1);
    }
    
    // Handle number literals
    if (/^-?\d+(\.\d+)?$/.test(varExpr)) {
      return Number(varExpr);
    }
    
    // Handle boolean literals
    if (varExpr === 'true') return true;
    if (varExpr === 'false') return false;
    
    // Handle variable paths
    const varPath = varExpr.split('.');
    let value = variables;
    
    for (const key of varPath) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key.trim()];
    }
    
    return value;
  }

  /**
   * Generate content from a template
   * @param {string} templateContent - Template content
   * @param {Object} data - Data for template processing
   * @returns {string} Generated content
   */
  generateContent(templateContent, data) {
    return this.process(templateContent, data);
  }

  /**
   * Add whitespace indentation to a block of text
   * @param {string} text - Text to indent
   * @param {number} [spaces=2] - Number of spaces to indent
   * @returns {string} Indented text
   */
  static indent(text, spaces = 2) {
    const indent = ' '.repeat(spaces);
    return text
      .split('\n')
      .map(line => line ? `${indent}${line}` : line)
      .join('\n');
  }

  /**
   * Format a string with variables using a simpler syntax
   * @param {string} template - Template string with {variable} placeholders
   * @param {Object} variables - Variables to substitute
   * @returns {string} Formatted string
   */
  static format(template, variables) {
    return template.replace(/{([^{}]+)}/g, (match, varName) => {
      const value = variables[varName.trim()];
      return value !== undefined ? String(value) : match;
    });
  }
}

export { Engine };
