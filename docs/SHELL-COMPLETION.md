# Shell Completion for DirectoryMonster Commands

This document explains how to set up command completion for DirectoryMonster npm scripts in your shell.

## Bash Completion

1. Copy the completion script to your bash completion directory:

```bash
# Create the bash completion directory if it doesn't exist
mkdir -p ~/.bash_completion.d

# Copy the completion script
cp scripts/completion.bash ~/.bash_completion.d/directorymonster
```

2. Add the following to your `~/.bashrc` or `~/.bash_profile`:

```bash
# Load DirectoryMonster completion
if [ -f ~/.bash_completion.d/directorymonster ]; then
  . ~/.bash_completion.d/directorymonster
fi
```

3. Reload your shell:

```bash
source ~/.bashrc  # or ~/.bash_profile
```

4. Test the completion by typing `npm run ` and pressing Tab.

## Zsh Completion

1. Copy the completion script to your zsh functions directory:

```bash
# Create the zsh functions directory if it doesn't exist
mkdir -p ~/.zsh/functions

# Copy the completion script
cp scripts/completion.zsh ~/.zsh/functions/_npm_run
```

2. Add the following to your `~/.zshrc`:

```bash
# Add custom functions directory to fpath
fpath=(~/.zsh/functions $fpath)

# Initialize completion system
autoload -Uz compinit
compinit
```

3. Reload your shell:

```bash
source ~/.zshrc
```

4. Test the completion by typing `npm run ` and pressing Tab.

## Features

The completion scripts provide:

- Command suggestions when you press Tab after `npm run`
- Categorized commands for better organization
- Command descriptions in zsh (shown when cycling through options)
- Filtering based on what you've already typed

## Example Usage

```bash
# Type this and press Tab to see all available commands
npm run 

# Type this and press Tab to see all app commands
npm run app:

# Type this and press Tab to see all test commands
npm run test:
```

This makes it much easier to discover and use the available commands in the DirectoryMonster project.
