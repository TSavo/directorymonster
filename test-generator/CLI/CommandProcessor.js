/**
 * @fileoverview CommandProcessor module for handling command-line arguments and routing 
 * to appropriate handlers in the test generator tool.
 * 
 * This module provides a command-line interface for the test generator tool,
 * processing arguments, validating commands, and routing to appropriate handlers.
 * It also provides help and error messaging for users.
 * 
 * @module CLI/CommandProcessor
 */

import { Config } from '../Core/Config.js';
import { TestGenerator } from '../Generators/TestGenerator.js';
import { ComponentScaffolder } from '../Generators/ComponentScaffolder.js';
import { FixtureGenerator } from '../Generators/FixtureGenerator.js';

/**
 * @typedef {Object} CommandOptions
 * @property {string} command - The command to execute (e.g., 'test', 'component', 'fixture')
 * @property {Object} options - Options for the command
 * @property {string[]} args - Additional arguments for the command
 */

/**
 * Processes command-line arguments and executes the appropriate command.
 */
export class CommandProcessor {
  /**
   * Available commands in the test generator tool.
   * @type {Object.<string, { description: string, usage: string, examples: string[], handler: Function }>}
   * @private
   */
  #commands = {
    test: {
      description: 'Generate test files for a component',
      usage: 'test <componentName> [options]',
      examples: [
        'test Button',
        'test NavBar --features=hover,click,keyboard',
        'test Table --base --accessibility'
      ],
      handler: this.#handleTestCommand.bind(this)
    },
    component: {
      description: 'Scaffold a new React component',
      usage: 'component <componentName> [options]',
      examples: [
        'component Button',
        'component NavBar --props=title,links,onNavChange',
        'component Table --withHooks --withContext'
      ],
      handler: this.#handleComponentCommand.bind(this)
    },
    fixture: {
      description: 'Generate test fixtures',
      usage: 'fixture <componentName> [options]',
      examples: [
        'fixture Button',
        'fixture NavBar --count=5',
        'fixture Table --withHierarchy --depth=3'
      ],
      handler: this.#handleFixtureCommand.bind(this)
    },
    help: {
      description: 'Show help information',
      usage: 'help [command]',
      examples: [
        'help',
        'help test',
        'help component'
      ],
      handler: this.#handleHelpCommand.bind(this)
    },
    init: {
      description: 'Initialize test generator config',
      usage: 'init [options]',
      examples: [
        'init',
        'init --template=react',
        'init --customPath=./custom-templates'
      ],
      handler: this.#handleInitCommand.bind(this)
    }
  };

  /**
   * Parses command-line arguments.
   *
   * @param {string[]} args - Command-line arguments
   * @returns {CommandOptions} Parsed command options
   */
  parseArgs(args) {
    // Remove the first two arguments (node and script path)
    const userArgs = args.slice(2);
    
    if (userArgs.length === 0) {
      return { command: 'help', options: {}, args: [] };
    }

    const command = userArgs[0];
    const options = {};
    const positionalArgs = [];

    // Process remaining arguments
    for (let i = 1; i < userArgs.length; i++) {
      const arg = userArgs[i];
      
      if (arg.startsWith('--')) {
        // Handle --key=value format
        const equalIndex = arg.indexOf('=');
        if (equalIndex > 0) {
          const key = arg.substring(2, equalIndex);
          const value = arg.substring(equalIndex + 1);
          options[key] = value;
        } else {
          // Handle --flag format (boolean true)
          const key = arg.substring(2);
          options[key] = true;
        }
      } else if (arg.startsWith('-')) {
        // Handle -f format (shorthand flags)
        for (let j = 1; j < arg.length; j++) {
          options[arg[j]] = true;
        }
      } else {
        // It's a positional argument
        positionalArgs.push(arg);
      }
    }

    return { command, options, args: positionalArgs };
  }

  /**
   * Processes command-line arguments and executes the appropriate command.
   *
   * @param {string[]} args - Command-line arguments
   * @returns {Promise<void>}
   */
  async process(args) {
    const { command, options, args: positionalArgs } = this.parseArgs(args);
    
    // Check if command exists
    if (!this.#commands[command]) {
      this.#showError(`Unknown command: ${command}`);
      this.#showGeneralHelp();
      return;
    }

    try {
      // Execute command handler
      await this.#commands[command].handler(options, positionalArgs);
    } catch (error) {
      this.#showError(`Error executing command "${command}": ${error.message}`);
      console.error(error);
    }
  }

  /**
   * Handles the 'test' command to generate test files.
   *
   * @param {Object} options - Command options
   * @param {string[]} args - Positional arguments
   * @private
   */
  async #handleTestCommand(options, args) {
    if (args.length === 0) {
      this.#showError('Component name is required for test generation');
      this.#showCommandHelp('test');
      return;
    }

    const componentName = args[0];
    console.log(`Generating test files for component: ${componentName}`);
    console.log('Options:', options);
    
    // Import test generator dynamically 
    const { TestGenerator } = await import('../Generators/TestGenerator.js');
    const testGenerator = new TestGenerator();
    
    try {
      // Parse features from options
      const features = options.features ? options.features.split(',') : [];
      
      // Add individual feature flags
      if (options.base) features.push('base');
      if (options.actions) features.push('actions');
      if (options.hierarchy) features.push('hierarchy');
      if (options.sorting) features.push('sorting');
      if (options.accessibility) features.push('accessibility');
      
      // Generate tests
      await testGenerator.generateTests(componentName, {
        features: [...new Set(features)], // Remove duplicates
        ...options
      });
      
      console.log('✅ Test files generation completed successfully!');
    } catch (error) {
      this.#showError(`Failed to generate test files: ${error.message}`);
    }
  }

  /**
   * Handles the 'component' command to scaffold a new component.
   *
   * @param {Object} options - Command options
   * @param {string[]} args - Positional arguments
   * @private
   */
  async #handleComponentCommand(options, args) {
    if (args.length === 0) {
      this.#showError('Component name is required for component scaffolding');
      this.#showCommandHelp('component');
      return;
    }

    const componentName = args[0];
    console.log(`Scaffolding component: ${componentName}`);
    console.log('Options:', options);
    
    // Import component scaffolder dynamically
    const { ComponentScaffolder } = await import('../Generators/ComponentScaffolder.js');
    const scaffolder = new ComponentScaffolder();
    
    try {
      // Parse props from options
      const props = options.props ? options.props.split(',') : [];
      
      // Generate component
      await scaffolder.generateComponent(componentName, {
        props,
        withHooks: !!options.withHooks,
        withContext: !!options.withContext,
        ...options
      });
      
      console.log('✅ Component scaffolding completed successfully!');
    } catch (error) {
      this.#showError(`Failed to scaffold component: ${error.message}`);
    }
  }

  /**
   * Handles the 'fixture' command to generate test fixtures.
   *
   * @param {Object} options - Command options
   * @param {string[]} args - Positional arguments
   * @private
   */
  async #handleFixtureCommand(options, args) {
    if (args.length === 0) {
      this.#showError('Component name is required for fixture generation');
      this.#showCommandHelp('fixture');
      return;
    }

    const componentName = args[0];
    console.log(`Generating fixtures for component: ${componentName}`);
    console.log('Options:', options);
    
    // Import fixture generator dynamically
    const { FixtureGenerator } = await import('../Generators/FixtureGenerator.js');
    const fixtureGenerator = new FixtureGenerator();
    
    try {
      // Generate fixtures
      await fixtureGenerator.generateFixtures(componentName, {
        count: options.count ? parseInt(options.count, 10) : 3,
        withHierarchy: !!options.withHierarchy,
        depth: options.depth ? parseInt(options.depth, 10) : 2,
        ...options
      });
      
      console.log('✅ Fixture generation completed successfully!');
    } catch (error) {
      this.#showError(`Failed to generate fixtures: ${error.message}`);
    }
  }

  /**
   * Handles the 'help' command to show help information.
   *
   * @param {Object} options - Command options
   * @param {string[]} args - Positional arguments
   * @private
   */
  async #handleHelpCommand(options, args) {
    if (args.length === 0) {
      this.#showGeneralHelp();
    } else {
      const command = args[0];
      this.#showCommandHelp(command);
    }
  }

  /**
   * Handles the 'init' command to initialize the test generator configuration.
   *
   * @param {Object} options - Command options
   * @param {string[]} args - Positional arguments
   * @private
   */
  async #handleInitCommand(options, args) {
    console.log('Initializing test generator configuration...');
    console.log('Options:', options);
    
    try {
      // Create a new config instance
      const config = new Config();
      
      // Set template option if provided
      if (options.template) {
        config.set('template', options.template);
      }
      
      // Set custom template path if provided
      if (options.customPath) {
        config.set('templatePath', options.customPath);
      }
      
      // Save configuration
      await config.save();
      
      console.log('✅ Test generator configuration initialized successfully!');
    } catch (error) {
      this.#showError(`Failed to initialize configuration: ${error.message}`);
    }
  }

  /**
   * Shows general help information for all commands.
   * 
   * @private
   */
  #showGeneralHelp() {
    console.log('\n📋 Test Generator Tool - Help');
    console.log('============================');
    console.log('\nAvailable commands:\n');
    
    for (const [command, info] of Object.entries(this.#commands)) {
      console.log(`  ${command.padEnd(12)} ${info.description}`);
    }
    
    console.log('\nFor more information on a specific command, run:');
    console.log('  test-generator help <command>');
    console.log('\nExamples:');
    console.log('  test-generator test Button --features=hover,click');
    console.log('  test-generator component NavBar --props=title,links --withHooks');
    console.log('  test-generator fixture Table --count=5 --withHierarchy');
    console.log('\n');
  }

  /**
   * Shows help information for a specific command.
   * 
   * @param {string} command - Command name
   * @private
   */
  #showCommandHelp(command) {
    if (!this.#commands[command]) {
      this.#showError(`Unknown command: ${command}`);
      this.#showGeneralHelp();
      return;
    }
    
    const commandInfo = this.#commands[command];
    
    console.log(`\n📋 Command: ${command}`);
    console.log('============================');
    console.log(`\nDescription: ${commandInfo.description}`);
    console.log(`\nUsage: test-generator ${commandInfo.usage}`);
    
    console.log('\nExamples:');
    for (const example of commandInfo.examples) {
      console.log(`  test-generator ${example}`);
    }
    
    console.log('\n');
  }

  /**
   * Shows an error message.
   * 
   * @param {string} message - Error message
   * @private
   */
  #showError(message) {
    console.error(`\n❌ Error: ${message}\n`);
  }
}

export default CommandProcessor;
