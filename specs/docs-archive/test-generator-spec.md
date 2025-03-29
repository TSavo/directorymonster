# Test Generator Specification

## Overview

The Test Generator is a modular command-line tool designed to support test-first development in the DirectoryMonster project. It automates the creation of test files and component stubs based on requirements, ensuring consistent testing patterns across the codebase.

## Objectives

1. Support test-first development by generating test files before component implementation
2. Ensure consistent testing patterns across different components
3. Reduce boilerplate code in test files
4. Improve test coverage through comprehensive test generation
5. Streamline the development workflow with automation

## Architecture

The Test Generator follows a modular design with clear separation of concerns:

```
TestGenerator/
├── Core/
│   ├── Config.js            # Configuration management
│   ├── Engine.js            # Template processing engine
│   └── Templates.js         # Template management
├── Generators/
│   ├── TestGenerator.js     # Test file generation
│   ├── ComponentScaffolder.js # Component stub generation
│   └── FixtureGenerator.js  # Test fixture generation
├── CLI/
│   ├── CommandProcessor.js  # CLI command handling
│   └── InteractivePrompts.js # User input collection
└── Utils/
    ├── FileSystem.js        # File system operations
    ├── TestAnalyzer.js      # Test file analysis
    └── Requirements.js      # Requirements management
```

## Key Components

### Core

#### Config
- Manages configuration settings for paths, test types, and templates
- Loads and validates configuration from config file
- Provides access to configuration values throughout the application

#### Engine
- Processes templates with variable substitution
- Generates content based on templates and requirements
- Applies template transformations (conditional sections, loops)

#### Templates
- Manages template registration and retrieval
- Validates templates against expected schema
- Provides templates for different component and test types

### Generators

#### TestGenerator
- Generates test files based on component requirements
- Creates specialized test files for different aspects (base, actions, accessibility)
- Includes appropriate assertions based on component features

#### ComponentScaffolder
- Creates component stubs that satisfy test requirements
- Analyzes existing tests to extract requirements
- Generates TypeScript interfaces for props

#### FixtureGenerator
- Creates test fixture data for component testing
- Generates appropriate mock data based on component requirements
- Creates edge case data for testing error scenarios

### CLI

#### CommandProcessor
- Processes command-line arguments
- Routes commands to appropriate handlers
- Provides help and error messaging

#### InteractivePrompts
- Collects requirements through interactive prompts
- Validates user input
- Provides guidance on available options

### Utils

#### FileSystem
- Handles file system operations (read, write, check existence)
- Creates directories if they don't exist
- Provides error handling for file operations

#### TestAnalyzer
- Analyzes test files to extract component requirements
- Identifies required props and behaviors from tests
- Detects features based on test assertions

#### Requirements
- Validates component requirements
- Parses requirements from files
- Generates requirements from existing tests

## Commands

### generate-tests
Generates test files based on component requirements:

```
node scripts/test-generator generate-tests
```

Interactive prompts collect:
- Component name
- Component category
- Test types to generate
- Component features
- Required props

Outputs:
- Test files in the appropriate directory
- Test fixture data (optional)

### scaffold-component
Generates a component stub based on existing tests:

```
node scripts/test-generator scaffold-component
```

Interactive prompts collect:
- Component name
- Component category

Outputs:
- Component stub file with TypeScript interfaces
- Empty implementation that satisfies test requirements

### from-requirements
Generates tests and component stub from a requirements file:

```
node scripts/test-generator from-requirements
```

Interactive prompts collect:
- Path to requirements file

Outputs:
- Test files based on requirements
- Component stub based on requirements
- Test fixture data

## Test Structure

Each component can have multiple specialized test files:

1. **Base Test** (`ComponentName.test.tsx`)
   - Basic rendering tests
   - Props handling
   - Loading and error states

2. **Actions Test** (`ComponentName.actions.test.tsx`)
   - User interactions
   - Event handling
   - State changes

3. **Hierarchy Test** (`ComponentName.hierarchy.test.tsx`)
   - Parent-child relationships
   - Hierarchical display
   - Indentation and tree structure

4. **Sorting Test** (`ComponentName.sorting.test.tsx`)
   - Column sorting
   - Sort indicators
   - Data sorting logic

5. **Accessibility Test** (`ComponentName.accessibility.test.tsx`)
   - ARIA attributes
   - Keyboard navigation
   - Focus management
   - Screen reader support

## Component Requirements Schema

Requirements are collected interactively or loaded from a JSON file:

```json
{
  "componentName": "SiteForm",
  "category": "admin/sites",
  "testTypes": ["base", "actions", "accessibility"],
  "features": ["form", "data-loading", "errors", "loading", "interactions", "keyboard"],
  "props": [
    {
      "name": "siteSlug",
      "type": "string",
      "required": false,
      "defaultValue": ""
    },
    {
      "name": "onSubmit",
      "type": "function",
      "required": true
    },
    {
      "name": "onCancel",
      "type": "function",
      "required": true
    },
    {
      "name": "initialData",
      "type": "object",
      "required": false
    }
  ]
}
```

## Template System

Templates use a simple variable substitution syntax:

```
/**
 * Test suite for the {componentName} component
 * 
 * This suite tests the {testDescription}
 */
describe('{componentName} Component', () => {
  {testCases}
});
```

Variables are replaced with values from the requirements object.

## Implementation Plan

1. **Phase 1: Core Infrastructure**
   - Implement Config module
   - Implement FileSystem utilities
   - Create basic template engine
   - Develop command processor

2. **Phase 2: Base Templates**
   - Create base test templates
   - Create action test templates
   - Create accessibility test templates
   - Implement template management

3. **Phase 3: Generators**
   - Implement test generator
   - Implement component scaffolder
   - Implement fixture generator

4. **Phase 4: CLI Interface**
   - Implement interactive prompts
   - Create command handlers
   - Add help and documentation

5. **Phase 5: Advanced Features**
   - Implement test analyzer
   - Add requirements validation
   - Support batch generation
   - Add configuration options

## Integration with Development Workflow

The Test Generator integrates with the existing development workflow:

1. Developer defines component requirements (interactively or via file)
2. Generator creates test files with appropriate assertions
3. Developer runs tests (which fail initially)
4. Generator scaffolds component stub
5. Developer implements component to make tests pass
6. Tests verify implementation correctness

This enforces test-first development and ensures comprehensive test coverage.

## Benefits

1. **Consistency**: All components follow the same testing patterns
2. **Efficiency**: Reduces boilerplate code creation
3. **Coverage**: Ensures comprehensive test coverage
4. **Maintainability**: Modular test files focused on specific aspects
5. **Onboarding**: Makes it easier for new developers to learn testing patterns

## Future Enhancements

1. **Visual Test Generation**: Add support for generating visual regression tests
2. **Integration Test Generation**: Generate tests for component integration
3. **Test Coverage Analysis**: Analyze existing tests for coverage gaps
4. **Code Generation from Tests**: Improve component generation based on test analysis
5. **VS Code Extension**: Provide GUI interface for test generation

## Conclusion

The Test Generator streamlines the test-first development process for the DirectoryMonster project by automating test file creation and ensuring consistent testing patterns. It reduces boilerplate code, improves test coverage, and enforces best practices across the codebase.
