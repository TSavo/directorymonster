@echo off
echo Running API tests to demonstrate the failures reporter...
npx jest "tests/api" --config=jest.simple-failures.config.js
