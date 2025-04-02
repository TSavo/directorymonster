# GitHub Labels Implementation Guide

This document provides instructions for implementing the enhanced GitHub labels for the DirectoryMonster project.

## Why Enhanced Labels?

Our enhanced label system provides several benefits:
- Consistent workflow tracking through status labels
- Clear issue categorization with type labels
- Visual priority indicators
- Improved organization by feature area and technical concerns

## Implementation Instructions

1. **Run the Label Creation Script**

   The script `github_labels.sh` has been created in the project root directory. To run it:

   ```bash
   # Make the script executable
   chmod +x github_labels.sh

   # Run the script (requires GitHub CLI to be authenticated)
   ./github_labels.sh
   ```

   Note: Ensure you have GitHub CLI installed and authenticated with your account.

2. **Verify Labels Created Successfully**

   After running the script, visit the repository's labels page at:
   `https://github.com/{username}/directorymonster/labels`

   Verify that all labels have been created with the proper colors and descriptions.

3. **Label Usage Guidelines**

   ### Status Labels
   - `status:backlog` - Issue in backlog, not yet prioritized
   - `status:blocked` - Blocked by another issue
   - `status:in-progress` - Currently being worked on
   - `status:needs-review` - Ready for review
   - `status:ready` - Ready to be implemented

   ### Type Labels
   - `type:bug` - Something isn't working as expected
   - `type:enhancement` - New feature or improvement
   - `type:documentation` - Documentation improvements
   - `type:question` - Request for information
   - `type:refactor` - Code refactoring without feature changes
   - `type:test` - Test coverage improvements

   ### Priority Labels
   - `priority:critical` - Must be fixed ASAP
   - `priority:high` - High priority task
   - `priority:medium` - Medium priority task
   - `priority:low` - Low priority task

   ### Application Layers
   - `layer:component` - Reusable UI components
   - `layer:business-logic` - Business logic and data processing
   - `layer:data-access` - Data access, APIs, and storage
   - `layer:presentation` - UI rendering and display concerns
   - `layer:infrastructure` - Project infrastructure and configuration

   ### UI/UX Labels
   - `ui:display` - Visual display issues
   - `ui:interaction` - User interaction and behavior
   - `ui:styling` - CSS and styling issues
   - `ui:accessibility` - Accessibility concerns
   - `ui:responsive` - Responsive design issues

   ### Testing Types
   - `test:unit` - Unit testing
   - `test:component` - Component testing
   - `test:integration` - Integration testing
   - `test:e2e` - End-to-end testing

   ### Feature Areas
   - `area:auth` - Authentication and authorization
   - `area:listings` - Listing management features
   - `area:categories` - Category management features
   - `area:sites` - Site management features
   - `area:admin` - Admin dashboard features
   - `area:multitenancy` - Multi-tenancy features

   ### Technical Concerns
   - `tech:performance` - Performance optimization
   - `tech:security` - Security concerns
   - `tech:devops` - CI/CD, deployment, and Docker
   - `tech:dependencies` - Dependency updates or issues

   ### Contributor Experience
   - `good-first-issue` - Good for newcomers
   - `help-wanted` - Extra attention is needed
   - `discussion` - Needs discussion before implementation

## Best Practices for Using Labels

1. **Apply Labels Sparingly**
   - Most issues should have 2-4 labels
   - Apply one status label, one type label, and 1-2 additional relevant labels

2. **Update Status Labels as Issues Progress**
   - Update from `status:backlog` to `status:ready` when ready for work
   - Change to `status:in-progress` when work starts
   - Move to `status:needs-review` when ready for PR review

3. **Use Priority Labels Meaningfully**
   - Reserve `priority:critical` for true emergencies/blockers
   - Apply priority labels based on sprint planning decisions

4. **Use Area Labels for Filtering**
   - Apply area labels to make it easy to find all issues related to a specific feature area

## Example Workflows

### Bug Fix Workflow
1. Issue created with `type:bug`, `status:backlog`, appropriate area label
2. Triaged and assigned `priority:medium`
3. Moved to `status:ready` during sprint planning
4. Developer assigns themselves and changes to `status:in-progress`
5. After fix, creates PR and changes to `status:needs-review`

### Feature Implementation Workflow
1. Issue created with `type:enhancement`, `status:backlog`, appropriate area label
2. Discussion happens, possibly with `discussion` label temporarily
3. Requirements finalized, moved to `status:ready` with appropriate priority
4. Developer starts work, changes to `status:in-progress`
5. Implementation completed, PR created, labeled as `status:needs-review`

## Migration Strategy

For existing issues:
1. Start with high-priority and active issues
2. Apply the new labels to all new issues going forward
3.