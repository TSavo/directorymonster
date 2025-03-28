# Test Generator Tool

A modular command-line tool for generating test files, scaffolding components, and creating test fixtures following project best practices.

## Overview

The Test Generator Tool automates the creation of test files, React components, and test fixtures according to established DirectoryMonster project patterns. It helps ensure consistent code quality and test coverage while reducing the time spent on boilerplate code.

## Features

- **Test Generation**: Create comprehensive test files for React components
  - Support for multiple test types (base, actions, hierarchy, etc.)
  - Accessibility testing built-in
  - Proper React Testing Library implementation

- **Component Scaffolding**: Generate React component files with best practices
  - TypeScript support
  - Props type definitions
  - Hooks integration
  - Context support

- **Fixture Generation**: Create test fixtures with realistic data
  - Support for hierarchical data structures
  - Edge case generation
  - Custom fixture templates

## Installation

The test generator tool is included in the DirectoryMonster project and can be run using npm:

```bash
npm run test-generator <command> [options]
```

## Commands

### Generate Test Files

```bash
npm run test-generator test <componentName> [options]
```

Options:
- `--features=<features>`: Comma-separated list of features to test (e.g., hierarchy,sorting,actions)
- `--base`: Include basic rendering tests
- `--actions`: Include action tests
- `--hierarchy`: Include hierarchy tests
- `--sorting`: Include sorting tests
- `--accessibility`: Include accessibility tests

Examples:
```bash
npm run test-generator test Button
npm run test-generator test NavBar --features=hover,click,keyboard
npm run test-generator test Table --base --accessibility
```

### Scaffold Component

```bash
npm run test-generator component <componentName> [options]
```

Options:
- `--props=<props>`: Comma-separated list of props (e.g., title,items,onChange)
- `--withHooks`: Include React hooks
- `--withContext`: Include context integration

Examples:
```bash
npm run test-generator component Button
npm run test-generator component NavBar --props=title,links,onNavChange
npm run test-generator component Table --withHooks --withContext
```

### Generate Fixtures

```bash
npm run test-generator fixture <componentName> [options]
```

Options:
- `--count=<number>`: Number of fixtures to generate
- `--withHierarchy`: Generate hierarchical data
- `--depth=<number>`: Depth of the hierarchy

Examples:
```bash
npm run test-generator fixture Button
npm run test-generator fixture NavBar --count=5
npm run test-generator fixture Table --withHierarchy --depth=3
```

### Initialize Configuration

```bash
npm run test-generator init [options]
```

Options:
- `--template=<name>`: Template to use (e.g., react, next)
- `--customPath=<path>`: Path to custom templates

Examples:
```bash
npm run test-generator init
npm run test-generator init --template=react
npm run test-generator init --customPath=./custom-templates
```

### Help

```bash
npm run test-generator help [command]
```

Examples:
```bash
npm run test-generator help
npm run test-generator help test
npm run test-generator help component
```

## Interactive Mode

If you prefer guided prompts instead of command-line options, simply run a command without all required arguments, and the tool will enter interactive mode:

```bash
npm run test-generator test
```

This will prompt you with questions about the component and test requirements.

## Project Integration

The Test Generator follows DirectoryMonster project conventions:

1. **Test Files**: Generated in the `tests/` directory mirroring the component structure
2. **Components**: Created in the appropriate directory based on component type
3. **Fixtures**: Placed in `tests/__fixtures__/` directory for easy access

## Module Architecture

The Test Generator follows a modular design:

```
test-generator/
├── CLI/
│   ├── CommandProcessor.js    # Command-line argument processing
│   └── InteractivePrompts.js  # Interactive user prompts
├── Core/
│   ├── Config.js             # Configuration management
│   ├── Engine.js             # Template processing engine
│   └── Template.js           # Template registration and retrieval
├── Generators/
│   ├── TestGenerator.js      # Test file generation
│   ├── ComponentScaffolder.js # Component scaffolding
│   └── FixtureGenerator.js   # Test fixture generation
├── Utils/
│   └── FileSystem.js         # File system operations
└── index.js                  # Main entry point
```

## Best Practices

1. **Use Data Attributes**: Add `data-testid` attributes to all key elements in components
2. **Test Behavior, Not Implementation**: Focus on component behavior and user interactions
3. **Accessibility Testing**: Verify proper ARIA attributes and keyboard navigation
4. **Reduce CSS Coupling**: Avoid selecting elements by CSS classes
5. **Test Edge Cases**: Include tests for empty states and error handling
6. **Focus Management Testing**: Test focus cycling with Tab key navigation

## Guidelines

For detailed information on testing best practices, see the [Testing Guidelines](../docs/testing/guidelines.md) in the project documentation.

## Contributing

If you want to extend the Test Generator:

1. Add new templates in the appropriate template directory
2. Update the relevant generator module
3. Register any new commands in CommandProcessor.js
4. Document the new functionality in this README

## License

This project is covered under the project's main license.
