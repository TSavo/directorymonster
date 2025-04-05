#!/usr/bin/env zsh
# DirectoryMonster command completion for zsh

_npm_run_completion() {
  local -a commands
  
  # Simple commands
  commands+=("run:Run the app in development mode")
  commands+=("build:Build and run the app in production mode")
  commands+=("test:Run all tests")
  commands+=("verify:Verify everything is working")
  commands+=("docker:Run everything in Docker")
  commands+=("setup:Set up ZKP authentication")
  
  # App commands
  commands+=("app\:dev:Run the app in development mode")
  commands+=("app\:dev\:docker:Run the app in development mode with Docker")
  commands+=("app\:build:Build the app for production")
  commands+=("app\:start:Start the app in production mode")
  commands+=("app\:lint:Lint the codebase")
  commands+=("app\:format:Format the codebase with Prettier")
  commands+=("app\:typecheck:Check TypeScript types")
  commands+=("app\:all:Set up, verify, build, and run the app")
  
  # Docker commands
  commands+=("docker\:build:Build Docker containers")
  commands+=("docker\:build\:python:Build Python Docker container")
  commands+=("docker\:up:Start Docker containers")
  commands+=("docker\:down:Stop Docker containers")
  commands+=("docker\:logs:View Docker logs")
  commands+=("docker\:all:Build and run everything in Docker")
  commands+=("docker\:zkp\:up:Start ZKP Docker containers")
  commands+=("docker\:zkp\:down:Stop ZKP Docker containers")
  commands+=("docker\:zkp\:logs:View ZKP Docker logs")
  
  # ZKP commands
  commands+=("zkp\:setup:Set up ZKP authentication")
  commands+=("zkp\:update:Update ZKP implementation")
  commands+=("zkp\:debug:Debug ZKP verification issues")
  commands+=("zkp\:test\:poseidon:Test Poseidon hash function")
  commands+=("zkp\:test\:passwords:Test password handling")
  commands+=("zkp\:verify:Verify ZKP setup")
  
  # Security commands
  commands+=("security\:verify:Verify file integrity")
  commands+=("security\:generate:Generate new checksums")
  commands+=("security\:check:Run security tests and verify integrity")
  commands+=("security\:audit:Run security audit on dependencies")
  commands+=("security\:all:Run all security checks")
  
  # Data commands
  commands+=("data\:seed:Seed the database")
  commands+=("data\:seed\:js:Seed the database with JavaScript")
  commands+=("data\:seed\:docker:Seed the database in Docker")
  commands+=("data\:seed\:auth:Seed the database with authentication data")
  commands+=("data\:clear\:users:Clear Redis users")
  
  # Test commands
  commands+=("test\:all:Run all tests")
  commands+=("test\:verify:Verify everything is working")
  commands+=("test\:unit:Run unit tests")
  commands+=("test\:integration:Run integration tests")
  commands+=("test\:api:Run API tests")
  commands+=("test\:components:Run component tests")
  commands+=("test\:components\:categories:Run category component tests")
  commands+=("test\:components\:listings:Run listing component tests")
  commands+=("test\:crypto:Run crypto tests")
  commands+=("test\:crypto\:core:Run core ZKP tests")
  commands+=("test\:crypto\:setup:Test ZKP setup")
  commands+=("test\:crypto\:security:Run security-related crypto tests")
  commands+=("test\:e2e:Run end-to-end tests")
  commands+=("test\:e2e\:all:Run all end-to-end tests")
  commands+=("test\:coverage:Run tests with coverage")
  commands+=("test\:with\:seed:Run tests with seeded data")
  commands+=("test\:with\:seed\:docker:Run tests with seeded data in Docker")
  commands+=("test\:docker:Run tests in Docker")
  
  _describe 'npm run commands' commands
}

# Register the completion function
compdef _npm_run_completion npm run
