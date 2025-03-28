# Next Steps for DirectoryMonster Development

## Fixing Template Processing Issues in the Test Generator

The test generator tool is working but has issues with template processing. Specifically, the Handlebars templates are not being correctly processed, resulting in template placeholders appearing in the generated test files. Please focus on the following tasks:

1. Fix the template processing in the test generator by:
   - Updating the TestGenerator._generateTestFile method in test-generator/Generators/TestGenerator.js to correctly use the HandlebarsEngine instead of the older Engine
   - Ensuring template variables are properly substituted in the generated output
   - Fixing the issue with component references: `import { {SiteForm} }` should be `import { SiteForm }`
   - Correcting testId references: `screen.getByTestId('{siteForm}-header')` should be `screen.getByTestId('siteForm-header')`

2. I've already manually fixed SiteForm.test.tsx, but the validation and submission test files still have template placeholder issues.

3. After fixing the template processing issues, generate test files for the DomainManager component that was created using:
   ```
   node test-generator/index.js test DomainManager --category=admin/sites --features=form,validation,submission,domains --testTypes=base,validation,submission
   ```

## Implementing Domain Management Features

1. Enhance the DomainManager component with actual domain handling capabilities:
   - Add ability to add, edit and remove domains
   - Implement domain validation (proper format, no duplicates)
   - Connect to API for saving domain settings

2. The DomainManager component was created using the test generator tool but needs the following specific implementations:
   - State management for domain list
   - Form input for adding domains
   - UI for displaying and removing domains
   - Proper validation before submission

## Additional Tasks

1. Update the test generator documentation to explain the proper use of Handlebars templates
2. Consider creating additional helper functions in the HandlebarsEngine to support more complex template operations
3. Test the fix by generating components and tests for other site management interfaces

## Notes on Current Progress

- We've successfully integrated the Handlebars template engine with the test generator
- The ComponentScaffolder is working correctly and can generate React components
- The test generator can generate test files but has template processing issues
- Work has been done to fix TypeScript errors and ensure proper module imports

Remember to update the checkpoint.md file after completing each task and commit your changes regularly.
