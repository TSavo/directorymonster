#!/usr/bin/env bash
# DirectoryMonster command completion for bash

_npm_run_completion() {
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  
  # If we're completing for "npm run", offer our scripts
  if [[ ${prev} == "run" ]]; then
    # Simple commands
    simple_commands="run build test verify docker setup"
    
    # Category commands
    app_commands="app:dev app:dev:docker app:build app:start app:lint app:format app:typecheck app:all"
    docker_commands="docker:build docker:build:python docker:up docker:down docker:logs docker:all docker:zkp:up docker:zkp:down docker:zkp:logs"
    zkp_commands="zkp:setup zkp:update zkp:debug zkp:test:poseidon zkp:test:passwords zkp:verify"
    security_commands="security:verify security:generate security:check security:audit security:all"
    data_commands="data:seed data:seed:js data:seed:docker data:seed:auth data:clear:users"
    test_commands="test:all test:verify test:unit test:integration test:api test:components test:components:categories test:components:listings test:crypto test:crypto:core test:crypto:setup test:crypto:security test:e2e test:e2e:all test:coverage test:with:seed test:with:seed:docker test:docker"
    
    # Combine all commands
    all_commands="$simple_commands $app_commands $docker_commands $zkp_commands $security_commands $data_commands $test_commands"
    
    # Filter based on current word
    COMPREPLY=( $(compgen -W "${all_commands}" -- ${cur}) )
    return 0
  fi
}

# Register the completion function
complete -F _npm_run_completion npm
