/**
 * @fileoverview InteractivePrompts module for collecting requirements through
 * interactive command-line prompts in the test generator tool.
 * 
 * This module provides interactive prompts for collecting test and component
 * requirements from users. It handles input validation and provides guidance
 * on available options.
 * 
 * @module CLI/InteractivePrompts
 */

/**
 * Class for handling interactive prompts for the test generator tool.
 */
export class InteractivePrompts {
  /**
   * Creates a new instance of InteractivePrompts.
   * This constructor loads the readline module dynamically since it's a Node.js specific module.
   */
  constructor() {
    this.readline = null;
    this.rl = null;
  }

  /**
   * Initializes the readline interface.
   * 
   * @returns {Promise<void>}
   * @private
   */
  async #initializeReadline() {
    if (!this.readline) {
      // Dynamically import readline module (Node.js specific)
      this.readline = await import('readline');
      
      // Create readline interface
      this.rl = this.readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      // Promisify the question method
      this.rl.questionAsync = (query) => new Promise((resolve) => {
        this.rl.question(query, resolve);
      });
    }
  }

  /**
   * Asks a yes/no question with validation.
   * 
   * @param {string} question - The question to ask
   * @param {boolean} defaultValue - Default value if user enters empty string
   * @returns {Promise<boolean>} User's answer as boolean
   */
  async askYesNo(question, defaultValue = true) {
    await this.#initializeReadline();
    
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    let answer = await this.rl.questionAsync(`${question} [${defaultText}]: `);
    
    if (answer.trim() === '') {
      return defaultValue;
    }
    
    answer = answer.trim().toLowerCase();
    
    if (['y', 'yes', 'true', '1'].includes(answer)) {
      return true;
    } else if (['n', 'no', 'false', '0'].includes(answer)) {
      return false;
    } else {
      console.log('Please enter "yes" or "no".');
      return this.askYesNo(question, defaultValue);
    }
  }

  /**
   * Asks a question and returns the answer.
   * 
   * @param {string} question - The question to ask
   * @param {string} defaultValue - Default value if user enters empty string
   * @returns {Promise<string>} User's answer
   */
  async askQuestion(question, defaultValue = '') {
    await this.#initializeReadline();
    
    const defaultText = defaultValue ? ` [${defaultValue}]` : '';
    const answer = await this.rl.questionAsync(`${question}${defaultText}: `);
    
    return answer.trim() || defaultValue;
  }

  /**
   * Asks for a selection from a list of options.
   * 
   * @param {string} question - The question to ask
   * @param {string[]} options - Array of available options
   * @param {string} defaultValue - Default value if user enters empty string
   * @returns {Promise<string>} User's selected option
   */
  async askSelection(question, options, defaultValue = '') {
    await this.#initializeReadline();
    
    console.log(`\n${question}`);
    
    options.forEach((option, index) => {
      const isDefault = option === defaultValue ? ' (default)' : '';
      console.log(`  ${index + 1}. ${option}${isDefault}`);
    });
    
    const answer = await this.rl.questionAsync('Enter selection number: ');
    
    if (answer.trim() === '' && defaultValue) {
      return defaultValue;
    }
    
    const selection = parseInt(answer.trim(), 10);
    
    if (isNaN(selection) || selection < 1 || selection > options.length) {
      console.log(`Please enter a number between 1 and ${options.length}.`);
      return this.askSelection(question, options, defaultValue);
    }
    
    return options[selection - 1];
  }

  /**
   * Asks for multiple selections from a list of options.
   * 
   * @param {string} question - The question to ask
   * @param {string[]} options - Array of available options
   * @param {string[]} defaultValues - Default values if user enters empty string
   * @returns {Promise<string[]>} User's selected options
   */
  async askMultiSelection(question, options, defaultValues = []) {
    await this.#initializeReadline();
    
    console.log(`\n${question}`);
    console.log('(Enter comma-separated numbers, e.g., "1,3,4")');
    
    options.forEach((option, index) => {
      const isDefault = defaultValues.includes(option) ? ' (default)' : '';
      console.log(`  ${index + 1}. ${option}${isDefault}`);
    });
    
    const answer = await this.rl.questionAsync('Enter selection numbers: ');
    
    if (answer.trim() === '' && defaultValues.length > 0) {
      return defaultValues;
    }
    
    // Process comma-separated selections
    const selections = answer
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= options.length)
      .map(n => options[n - 1]);
      
    if (selections.length === 0) {
      console.log('Please enter at least one valid selection.');
      return this.askMultiSelection(question, options, defaultValues);
    }
    
    return selections;
  }

  /**
   * Prompts the user for component requirements.
   * 
   * @param {string} componentName - Component name
   * @returns {Promise<Object>} Component requirements
   */
  async promptForComponentRequirements(componentName) {
    console.log(`\n📋 Component Requirements for ${componentName}`);
    console.log('===============================================');
    
    const requirements = {
      componentName,
      props: [],
      withStyles: false,
      withHooks: false,
      withContext: false,
      isTypescript: false,
      includeStories: false
    };
    
    // Ask for props
    const propsInput = await this.askQuestion(
      'Component props (comma-separated, e.g., "title,items,onChange")',
      ''
    );
    
    if (propsInput) {
      requirements.props = propsInput
        .split(',')
        .map(prop => prop.trim())
        .filter(prop => prop.length > 0);
    }
    
    // Ask for additional features
    requirements.withStyles = await this.askYesNo(
      'Include styles?',
      true
    );
    
    requirements.withHooks = await this.askYesNo(
      'Use React hooks?',
      true
    );
    
    requirements.withContext = await this.askYesNo(
      'Include context integration?',
      false
    );
    
    requirements.isTypescript = await this.askYesNo(
      'Use TypeScript?',
      true
    );
    
    requirements.includeStories = await this.askYesNo(
      'Generate Storybook stories?',
      false
    );
    
    return requirements;
  }

  /**
   * Prompts the user for test requirements.
   * 
   * @param {string} componentName - Component name
   * @returns {Promise<Object>} Test requirements
   */
  async promptForTestRequirements(componentName) {
    console.log(`\n📋 Test Requirements for ${componentName}`);
    console.log('===============================================');
    
    const testTypes = [
      'Basic Rendering',
      'Props Validation',
      'State Changes',
      'Event Handling',
      'User Interactions',
      'Accessibility',
      'Snapshot Tests'
    ];
    
    const featureTypes = [
      'hierarchy',
      'sorting',
      'filtering',
      'pagination',
      'actions',
      'keyboard',
      'hover',
      'focus'
    ];
    
    const requirements = {
      componentName,
      testTypes: [],
      features: [],
      generateFixtures: false,
      useTestIds: true,
      useRTL: true,
      useMSW: false
    };
    
    // Ask for test types
    requirements.testTypes = await this.askMultiSelection(
      'Select test types to generate:',
      testTypes,
      ['Basic Rendering', 'Props Validation']
    );
    
    // Ask for features to test
    requirements.features = await this.askMultiSelection(
      'Select component features to test:',
      featureTypes,
      []
    );
    
    // Ask for additional options
    requirements.generateFixtures = await this.askYesNo(
      'Generate test fixtures?',
      true
    );
    
    requirements.useTestIds = await this.askYesNo(
      'Use data-testid attributes?',
      true
    );
    
    requirements.useRTL = await this.askYesNo(
      'Use React Testing Library?',
      true
    );
    
    requirements.useMSW = await this.askYesNo(
      'Use Mock Service Worker for API mocking?',
      false
    );
    
    return requirements;
  }

  /**
   * Prompts the user for fixture requirements.
   * 
   * @param {string} componentName - Component name
   * @returns {Promise<Object>} Fixture requirements
   */
  async promptForFixtureRequirements(componentName) {
    console.log(`\n📋 Fixture Requirements for ${componentName}`);
    console.log('===============================================');
    
    const requirements = {
      componentName,
      count: 3,
      withHierarchy: false,
      depth: 2,
      includeEdgeCases: true
    };
    
    // Ask for count
    const countInput = await this.askQuestion(
      'Number of fixtures to generate',
      '3'
    );
    
    requirements.count = parseInt(countInput, 10) || 3;
    
    // Ask for hierarchy
    requirements.withHierarchy = await this.askYesNo(
      'Generate hierarchical data?',
      false
    );
    
    if (requirements.withHierarchy) {
      const depthInput = await this.askQuestion(
        'Maximum hierarchy depth',
        '2'
      );
      
      requirements.depth = parseInt(depthInput, 10) || 2;
    }
    
    // Ask for edge cases
    requirements.includeEdgeCases = await this.askYesNo(
      'Include edge cases (empty, null, error states)?',
      true
    );
    
    return requirements;
  }

  /**
   * Closes the readline interface.
   */
  close() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }
}

export default InteractivePrompts;
