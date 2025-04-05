# do-it-all.ps1 - The "I can't be arsed" script that does everything

Write-Host "DirectoryMonster - Doing EVERYTHING for you" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
$versionNumber = $nodeVersion.Substring(1) -split '\.'
$majorVersion = [int]$versionNumber[0]

if ($majorVersion -lt 14) {
    Write-Host "Error: Node.js version $nodeVersion is not supported." -ForegroundColor Red
    Write-Host "DirectoryMonster requires Node.js version 14.x or higher." -ForegroundColor Red
    Write-Host "Please upgrade your Node.js installation: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "Node.js version $nodeVersion meets requirements (>= 14.x)." -ForegroundColor Green
}

# Setup ZKP authentication
Write-Host "Setting up ZKP authentication..." -ForegroundColor Yellow
npm run zkp:setup

# Verify the setup
Write-Host "Verifying ZKP setup..." -ForegroundColor Yellow
npm run test:crypto:setup

# Verify file integrity
Write-Host "Verifying file integrity..." -ForegroundColor Yellow
npm run security:verify

# Build the application
Write-Host "Building the application..." -ForegroundColor Yellow
npm run app:build

# Start the application
Write-Host "Starting the application..." -ForegroundColor Yellow
npm run app:start

Write-Host "DirectoryMonster is now running with ZKP authentication!" -ForegroundColor Green
