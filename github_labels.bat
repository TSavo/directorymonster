@echo off
echo Creating enhanced GitHub labels for DirectoryMonster...

echo Specify the repository owner and name:
set /p REPO_OWNER="Repository owner (username): "
set /p REPO_NAME="Repository name: "

rem Core labels - Status indicators
gh label create "status:backlog" --color "#FBCA04" --description "Issue in backlog, not yet prioritized" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: status:backlog
gh label create "status:blocked" --color "#D93F0B" --description "Blocked by another issue" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: status:blocked
gh label create "status:in-progress" --color "#0E8A16" --description "Currently being worked on" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: status:in-progress
gh label create "status:needs-review" --color "#1D76DB" --description "Ready for review" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: status:needs-review
gh label create "status:ready" --color "#0075CA" --description "Ready to be implemented" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: status:ready

rem Core labels - Type indicators
gh label create "type:bug" --color "#D73A4A" --description "Something isn't working as expected" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: type:bug
gh label create "type:enhancement" --color "#0E8A16" --description "New feature or improvement" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: type:enhancement
gh label create "type:documentation" --color "#0075CA" --description "Documentation improvements" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: type:documentation
gh label create "type:question" --color "#8DA6CE" --description "Request for information" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: type:question
gh label create "type:refactor" --color "#FBCA04" --description "Code refactoring without feature changes" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: type:refactor
gh label create "type:test" --color "#BFD4F2" --description "Test coverage improvements" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: type:test

rem Priority indicators
gh label create "priority:critical" --color "#B60205" --description "Must be fixed ASAP" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: priority:critical
gh label create "priority:high" --color "#D93F0B" --description "High priority task" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: priority:high
gh label create "priority:medium" --color "#FFA500" --description "Medium priority task" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: priority:medium
gh label create "priority:low" --color "#47C97D" --description "Low priority task" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: priority:low

rem Application layers
gh label create "layer:component" --color "#BFD4F2" --description "Reusable UI components" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: layer:component
gh label create "layer:business-logic" --color "#C5DEF5" --description "Business logic and data processing" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: layer:business-logic
gh label create "layer:data-access" --color "#BFDADC" --description "Data access, APIs, and storage" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: layer:data-access
gh label create "layer:presentation" --color "#D4C5F9" --description "UI rendering and display concerns" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: layer:presentation
gh label create "layer:infrastructure" --color "#D2B48C" --description "Project infrastructure and configuration" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: layer:infrastructure

rem UI/UX specific
gh label create "ui:display" --color "#C064DD" --description "Visual display issues" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: ui:display
gh label create "ui:interaction" --color "#CC91E4" --description "User interaction and behavior" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: ui:interaction
gh label create "ui:styling" --color "#D2A8EA" --description "CSS and styling issues" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: ui:styling
gh label create "ui:accessibility" --color "#E0B1EF" --description "Accessibility concerns" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: ui:accessibility
gh label create "ui:responsive" --color "#DEB6F2" --description "Responsive design issues" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: ui:responsive

rem Testing types
gh label create "test:unit" --color "#BFD4F2" --description "Unit testing" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: test:unit
gh label create "test:component" --color "#C9DDF6" --description "Component testing" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: test:component
gh label create "test:integration" --color "#D3E7F9" --description "Integration testing" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: test:integration
gh label create "test:e2e" --color "#DEF0FC" --description "End-to-end testing" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: test:e2e

rem Feature areas
gh label create "area:auth" --color "#1E76D9" --description "Authentication and authorization" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: area:auth
gh label create "area:listings" --color "#3584DC" --description "Listing management features" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: area:listings
gh label create "area:categories" --color "#4B91DE" --description "Category management features" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: area:categories
gh label create "area:sites" --color "#619FE1" --description "Site management features" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: area:sites
gh label create "area:admin" --color "#78ACE3" --description "Admin dashboard features" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: area:admin
gh label create "area:multitenancy" --color "#8EBAE6" --description "Multi-tenancy features" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: area:multitenancy

rem Technical concerns
gh label create "tech:performance" --color "#0E8A16" --description "Performance optimization" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: tech:performance
gh label create "tech:security" --color "#D73A4A" --description "Security concerns" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: tech:security
gh label create "tech:devops" --color "#1D76DB" --description "CI/CD, deployment, and Docker" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: tech:devops
gh label create "tech:dependencies" --color "#FBCA04" --description "Dependency updates or issues" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: tech:dependencies

rem Contributor experience
gh label create "good-first-issue" --color "#7057FF" --description "Good for newcomers" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: good-first-issue
gh label create "help-wanted" --color "#008672" --description "Extra attention is needed" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: help-wanted
gh label create "discussion" --color "#CC317C" --description "Needs discussion before implementation" --repo %REPO_OWNER%/%REPO_NAME% || echo Label already exists: discussion

echo Label creation complete!
pause
