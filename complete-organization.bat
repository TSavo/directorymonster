@echo off
echo Completing workspace organization...

:: Ensure directories exist
if not exist "configs" mkdir configs
if not exist "examples" mkdir examples
if not exist "screenshots" mkdir screenshots
if not exist "scripts\unix" mkdir scripts\unix
if not exist "python" mkdir python
if not exist "docs" mkdir docs

:: Move shell scripts to scripts\unix directory
echo Moving Unix shell scripts to scripts\unix directory...
move *.sh scripts\unix\
move rebuild-docker.sh scripts\unix\
move rebuild-module-paths.sh scripts\unix\
move run-categories-debug.sh scripts\unix\
move run-first-user-test.sh scripts\unix\
move start.sh scripts\unix\
move test-api.sh scripts\unix\
move test-simple-api.sh scripts\unix\

:: Move screenshot files to screenshots directory
echo Moving screenshot files to screenshots directory...
move *.png screenshots\
move first-user-created.png screenshots\
move first-user-setup.png screenshots\
move homepage-smoke-test.png screenshots\
move login-admin-force.png screenshots\
move login-before-manual-nav.png screenshots\
move login-failure.png screenshots\
move login-navigation-failure.png screenshots\
move login-success.png screenshots\
move normal-login-after-setup.png screenshots\
move not-found-smoke-test.png screenshots\
move password-reset-failure.png screenshots\

:: Move JSON configuration files to configs directory
echo Moving configuration files to configs directory...
move listing-schema.json configs\
move directorymonster_products.json configs\
move mismatched-testids.json configs\
move test-imports.json configs\
move jest-output.json configs\
move jest-results.json configs\
move test-results.json configs\
move test_results.json configs\

:: Move example JSON files to examples directory
echo Moving example files to examples directory...
move create-hiking-category.json examples\
move create-hiking-listing.json examples\
move create-new-site.json examples\

:: Move Python scripts to python directory
echo Moving Python scripts to python directory...
move *.py python\
move extract-ebay-products.py python\
move generate_listings.py python\
move extractor.py python\
move test-api.py python\

:: Move documentation files to docs directory (keep README.md in root)
echo Moving documentation files to docs directory...
move *.md docs\
move CI-TEST.md docs\
move CLAUDE.md docs\
move CONTRIBUTING.md docs\
move DOCKER-DEV.md docs\
move DOCUMENTATION_INDEX.md docs\
move export-verification-report.md docs\
move github-issue-58-update.md docs\
move GITHUB_LABELS_README.md docs\
move IMPLEMENTATION_SUMMARY.md docs\
move next-prompt.md docs\
move pr32-review-checkpoint.md docs\
move tenant-id-protection-issue.md docs\
move TEST-README.md docs\
move SETUP_INSTRUCTIONS.md docs\
move checkpoint.md docs\

:: Restore the required README.md to root
copy docs\README.md .\

echo Workspace organization completed!
echo.
echo NOTE: Some files may not have been moved if they were:
echo  - Currently in use by another process
echo  - Already moved in a previous step
echo  - Not found in the current directory