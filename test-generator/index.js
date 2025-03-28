#!/usr/bin/env node

/**
 * @fileoverview Main entry point for the test generator CLI tool.
 * 
 * This file serves as the entry point for the test generator tool, setting up all modules
 * and providing the command-line interface. It handles overall tool execution and
 * error reporting.
 * 
 * @module test-generator
 */

import { CommandProcessor } from './CLI/CommandProcessor.js';
import { InteractivePrompts } from './CLI/InteractivePrompts.js';
import { Config } from './Core/Config.js';
import { Template } from './Core/Template.js';
import { Engine } from './Core/Engine.js';

/**
 * Main function for the test generator CLI tool.
 * 
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // Initialize configuration
    const config = new Config();
    await config.load();
    
    // Initialize template engine
    const templateManager = new Template(config.get('paths.templates'));
    await templateManager.initialize();
    
    // Initialize engine
    const engine = new Engine();
    
    // Create command processor
    const commandProcessor = new CommandProcessor();
    
    // Process command-line arguments
    await commandProcessor.process(process.argv);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Handles process termination signals for graceful shutdown.
 */
function setupSignalHandlers() {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Test generator tool terminated by user.');
    process.exit(0);
  });
  
  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Test generator tool terminated.');
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught exception:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ Unhandled promise rejection:', reason);
    process.exit(1);
  });
}

// Setup signal handlers
setupSignalHandlers();

// Execute main function
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
