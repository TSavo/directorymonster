#!/bin/bash

# GitHub Issues Creation Script
# This script creates GitHub issues from the JSON files generated by the migration script

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first:"
    echo "  https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "You are not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

# Directory containing the JSON files
ISSUES_DIR="./github-issues"

# Create issues from task JSON files
echo "Creating issues from task JSON files..."
for file in "$ISSUES_DIR"/task-*.json; do
    if [ -f "$file" ]; then
        title=$(jq -r '.title' "$file")
        body=$(jq -r '.body' "$file")
        labels=$(jq -r '.labels | join(",")' "$file")
        
        echo "Creating issue: $title"
        gh issue create --title "$title" --body "$body" --label "$labels"
        
        # Add a short delay to avoid rate limiting
        sleep 1
    fi
done

# Create issues from checkpoint JSON files
echo "Creating issues from checkpoint JSON files..."
for file in "$ISSUES_DIR"/checkpoint-issue-*.json; do
    if [ -f "$file" ]; then
        title=$(jq -r '.title' "$file")
        body=$(jq -r '.body' "$file")
        labels=$(jq -r '.labels | join(",")' "$file")
        
        echo "Creating issue: $title"
        gh issue create --title "$title" --body "$body" --label "$labels"
        
        # Add a short delay to avoid rate limiting
        sleep 1
    fi
done

echo "Issue creation complete!"
echo "Visit https://github.com/TSavo/directorymonster/issues to see your issues."