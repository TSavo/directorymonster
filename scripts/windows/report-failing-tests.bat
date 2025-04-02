@echo off
echo Running tests to identify failing files only...
npm run test:failing-files
echo.
echo Test results have been written to failing-tests.log
