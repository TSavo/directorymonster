#!/usr/bin/env node

/**
 * Mock Migration Tool - Main CLI Interface
 * 
 * Command-line tool for analyzing and migrating non-standard mocks
 * to standardized implementations.
 * 
 * Usage:
 *   node scripts/mock-migration [command] [options]
 * 
 * Commands:
 *   analyze     - Analyze test files for non-standard mocks
 *   suggest     - Suggest migrations for non-standard mocks
 *   migrate     - Apply suggested migrations to files
 * 
 * Options:
 *   --file      - Process a specific file
 *   --pattern   - Process files matching pattern (e.g., "tests/**/*.test.ts")
 *   --type      - Mock type to process (nextjs, redis, all)
 *   --report    - Generate report (html, json, console)
 *   --apply     - Apply migrations (with migrate command)
 *   --verbose   - Show detailed output
 *   --help      - Show help
 */

const fs = require('fs');
const path = require('path');
const coreScanner = require('./core-scanner');
const nextjsAnalyzer = require('./nextjs-analyzer');
const redisAnalyzer = require('./redis-analyzer');
const migrationGenerator = require('./migration-generator');
const reportGenerator = require('./report-generator');

// Default configuration
const DEFAULT_CONFIG = {
  testDirs: [
    'tests',
    'tests/api',
    'tests/middleware',
    'tests/redis',
    'tests/components',
    'tests/integration',
    'tests/unit'
  ],
  patterns: {
    nextjs: nextjsAnalyzer.NEXT_PATTERNS,
    redis: redisAnalyzer.REDIS_PATTERNS
  },
  ignorePatterns: nextjsAnalyzer.IGNORE_PATTERNS,
  reportPath: 'mock-migration-report'
};

/**
 * Parse command-line arguments
 * 
 * @param {string[]} args Command-line arguments
 * @returns {object} Parsed options
 */
function parseArgs(args) {
  const options = {
    command: 'analyze',
    file: null,
    pattern: null,
    type: 'all',
    report: 'console',
    apply: false,
    verbose: false
  };
  
  // Parse command (first non-flag argument)
  const commands = ['analyze', 'suggest', 'migrate'];
  for (const arg of args) {
    if (!arg.startsWith('--') && commands.includes(arg)) {
      options.command = arg;
      break;
    }
  }
  
  // Parse flags
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' && i + 1 < args.length) {
      options.file = args[++i];
    } else if (arg === '--pattern' && i + 1 < args.length) {
      options.pattern = args[++i];
    } else if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--report' && i + 1 < args.length) {
      options.report = args[++i];
    } else if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help') {
      showHelp();
      process.exit(0);
    }
  }
  
  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Mock Migration Tool

Usage:
  node scripts/mock-migration [command] [options]

Commands:
  analyze    - Analyze test files for non-standard mocks
  suggest    - Suggest migrations for non-standard mocks
  migrate    - Apply suggested migrations to files

Options:
  --file     - Process a specific file
  --pattern  - Process files matching pattern (e.g., "tests/**/*.test.ts")
  --type     - Mock type to process (nextjs, redis, all)
  --report   - Generate report (html, json, console)
  --apply    - Apply migrations (with migrate command)
  --verbose  - Show detailed output
  --help     - Show this help

Examples:
  node scripts/mock-migration analyze --file tests/api/example.test.ts
  node scripts/mock-migration suggest --type nextjs --report html
  node scripts/mock-migration migrate --file tests/api/example.test.ts --apply
  `);
}

/**
 * Find test files based on options
 * 
 * @param {object} options CLI options
 * @returns {string[]} Array of file paths
 */
function findTestFiles(options) {
  if (options.file) {
    // Process a specific file
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found - ${filePath}`);
      process.exit(1);
    }
    return [filePath];
  } else if (options.pattern) {
    // TODO: Implement glob pattern matching
    console.error('Pattern matching not implemented yet. Use --file instead.');
    process.exit(1);
  } else {
    // Process all test files in the configured directories
    return coreScanner.findTestFiles(DEFAULT_CONFIG.testDirs);
  }
}

/**
 * Check if a file needs mock migration based on options
 * 
 * @param {string} filePath File to check
 * @param {object} options CLI options
 * @returns {boolean} True if the file needs migration for the specified mock type
 */
function fileNeedsMigration(filePath, options) {
  const patterns = {};
  
  // Select patterns based on mock type
  if (options.type === 'all' || options.type === 'nextjs') {
    Object.assign(patterns, DEFAULT_CONFIG.patterns.nextjs);
  }
  if (options.type === 'all' || options.type === 'redis') {
    Object.assign(patterns, DEFAULT_CONFIG.patterns.redis);
  }
  
  return coreScanner.fileNeedsStandardization(
    filePath, 
    patterns, 
    DEFAULT_CONFIG.ignorePatterns
  );
}

/**
 * Analyze test files and generate reports
 * 
 * @param {object} options CLI options
 */
async function analyzeFiles(options) {
  console.log('Analyzing test files for non-standard mocking patterns...');
  
  // Find files to analyze
  const files = findTestFiles(options);
  
  // Track statistics
  const stats = {
    filesAnalyzed: 0,
    filesNeedingChanges: 0,
    nextRequestMocks: 0,
    nextResponseMocks: 0,
    redisMocks: 0,
    totalSuggestions: 0
  };
  
  // Analyze each file
  const results = [];
  for (const filePath of files) {
    stats.filesAnalyzed++;
    
    if (fileNeedsMigration(filePath, options)) {
      stats.filesNeedingChanges++;
      
      // Generate migration suggestions
      const migrationSuggestions = migrationGenerator.generateMigrationSuggestions(filePath);
      results.push(migrationSuggestions);
      
      // Update statistics
      stats.totalSuggestions += migrationSuggestions.suggestions.length;
      
      // Log to console if verbose
      if (options.verbose) {
        console.log(`\n${filePath}:`);
        console.log(`  Suggestions: ${migrationSuggestions.suggestions.length}`);
      }
    } else if (options.verbose) {
      console.log(`${filePath}: No changes needed`);
    }
  }
  
  // Generate report
  if (options.report === 'html') {
    const html = reportGenerator.generateHTMLReport(results, stats);
    reportGenerator.writeReport(
      html, 
      `${DEFAULT_CONFIG.reportPath}.html`, 
      'html'
    );
  } else if (options.report === 'json') {
    const json = reportGenerator.generateJSONReport(results, stats);
    reportGenerator.writeReport(
      json, 
      `${DEFAULT_CONFIG.reportPath}.json`, 
      'json'
    );
  } else {
    // Console report (default)
    console.log('\n===================== SUMMARY =====================');
    console.log(`Analyzed ${stats.filesAnalyzed} files`);
    console.log(`Found ${stats.filesNeedingChanges} files with non-standard mocking patterns`);
    console.log(`Total suggestions: ${stats.totalSuggestions}`);
  }
  
  return { results, stats };
}

/**
 * Suggest migrations for non-standard mocks
 * 
 * @param {object} options CLI options
 */
async function suggestMigrations(options) {
  console.log('Generating migration suggestions...');
  
  // Find files to process
  const files = findTestFiles(options);
  
  // Track files with suggestions
  const filesWithSuggestions = [];
  
  // Process each file
  for (const filePath of files) {
    if (fileNeedsMigration(filePath, options)) {
      // Generate and display suggestions
      const migrationSuggestions = migrationGenerator.generateMigrationSuggestions(filePath);
      
      if (migrationSuggestions.hasSuggestions) {
        filesWithSuggestions.push(filePath);
        console.log(reportGenerator.generateConsoleReport(migrationSuggestions));
      }
    }
  }
  
  // Summary
  console.log('\n=============== SUMMARY ===============');
  console.log(`Found ${filesWithSuggestions.length} files with non-standard mocks`);
  if (options.command === 'suggest') {
    console.log('To apply these changes, run the tool with the "migrate" command and --apply flag');
  }
}

/**
 * Apply migrations to files
 * 
 * @param {object} options CLI options
 */
async function applyMigrations(options) {
  if (!options.apply) {
    console.log('Dry run mode (use --apply to actually modify files)');
  } else {
    console.log('Applying migrations to files...');
  }
  
  // Find files to process
  const files = findTestFiles(options);
  
  // Track statistics
  let modifiedFiles = 0;
  let totalChanges = 0;
  
  // Process each file
  for (const filePath of files) {
    if (fileNeedsMigration(filePath, options)) {
      // Generate suggestions
      const migrationSuggestions = migrationGenerator.generateMigrationSuggestions(filePath);
      
      if (migrationSuggestions.hasSuggestions) {
        // Log suggestions
        console.log(reportGenerator.generateConsoleReport(migrationSuggestions));
        
        // Apply changes if requested
        if (options.apply) {
          const result = migrationGenerator.applyMigrationSuggestions(filePath, migrationSuggestions);
          
          if (result.success) {
            modifiedFiles++;
            totalChanges += result.changeCount;
            console.log(`✅ ${result.message}`);
            console.log(`   Backup created at: ${result.backupPath}`);
          } else {
            console.error(`❌ Error: ${result.message}`);
          }
        }
      }
    }
  }
  
  // Summary
  console.log('\n=============== SUMMARY ===============');
  if (options.apply) {
    console.log(`Modified ${modifiedFiles} files with ${totalChanges} changes`);
  } else {
    console.log(`Found ${modifiedFiles} files that would be modified with ${totalChanges} changes`);
    console.log('Use --apply to actually modify the files');
  }
}

/**
 * Main function
 */
async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  // Calculate absolute paths for project
  const projectRoot = path.resolve(__dirname, '../..');
  DEFAULT_CONFIG.testDirs = DEFAULT_CONFIG.testDirs.map(dir => 
    path.join(projectRoot, dir)
  );
  
  // Execute command
  try {
    if (options.command === 'analyze') {
      await analyzeFiles(options);
    } else if (options.command === 'suggest') {
      await suggestMigrations(options);
    } else if (options.command === 'migrate') {
      await applyMigrations(options);
    } else {
      console.error(`Unknown command: ${options.command}`);
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();