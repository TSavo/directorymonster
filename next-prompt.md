# Next Context Window Prompt

## Project: DirectoryMonster Site Management Implementation

We've evaluated the test generator tool and determined that its custom template engine has significant issues that will take time to fix. We've decided to replace it with Handlebars in a future update, but for now we need to implement the SiteForm component manually.

For the next context window, please:

1. Implement the SiteForm component manually:
   - Follow the requirements from the test files
   - Create a proper React form with all required validations
   - Handle server interactions correctly
   - Ensure accessibility compliance

2. The component requirements include:
   - Fields for name, slug, description, and domains
   - Validation for required fields and format constraints
   - API integration for saving site data
   - Proper loading and error states
   - Accessible form controls with ARIA attributes

3. After implementing the SiteForm component:
   - Run the existing tests to verify functionality
   - Fix any test failures
   - Document any edge cases or limitations

4. Integrate the SiteForm component into the admin interface:
   - Create routes for site creation and editing
   - Add navigation links in the admin sidebar
   - Connect with the existing admin layout

5. Plan for Handlebars integration:
   - Document clear steps for integrating Handlebars
   - List templates that need conversion
   - Create a timeline for the migration

Remember to follow project conventions and maintain thorough documentation. We're prioritizing correct functionality and good user experience over custom tooling right now, with plans to improve the test generator with Handlebars in the near future.

Please update checkpoint.md with progress and commit your changes regularly.
