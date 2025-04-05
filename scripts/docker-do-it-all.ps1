# docker-do-it-all.ps1 - The "I can't be arsed" script that does everything with Docker

Write-Host "DirectoryMonster - Doing EVERYTHING with Docker for you" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Build the Docker image
Write-Host "Building the Docker image..." -ForegroundColor Yellow
npm run docker:build

# Start the Docker containers
Write-Host "Starting the Docker containers..." -ForegroundColor Yellow
npm run docker:up

# Setup ZKP authentication in Docker
Write-Host "Setting up ZKP authentication in Docker..." -ForegroundColor Yellow
npm run docker:zkp:setup

# Verify the setup
Write-Host "Verifying ZKP setup in Docker..." -ForegroundColor Yellow
npm run docker:zkp:verify

Write-Host "DirectoryMonster is now running in Docker with ZKP authentication!" -ForegroundColor Green
