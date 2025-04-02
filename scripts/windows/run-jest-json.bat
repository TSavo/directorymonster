@echo off
REM Run Jest with JSON output and handle any extra arguments
echo Running Jest with arguments: %*
node_modules/.bin/jest --json %*