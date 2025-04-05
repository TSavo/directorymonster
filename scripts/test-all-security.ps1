# test-all.ps1 - Run ALL the tests

Write-Host "DirectoryMonster - Running ALL tests" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

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

# Run crypto tests
Write-Host "Running crypto tests..." -ForegroundColor Yellow
npm run test:crypto

# Run security tests
Write-Host "Running security tests..." -ForegroundColor Yellow
npm run test:crypto:security

# Verify file integrity
Write-Host "Verifying file integrity..." -ForegroundColor Yellow
npm run security:verify

# Run core ZKP tests
Write-Host "Running core ZKP tests..." -ForegroundColor Yellow
npm run test:crypto:core

# Run ZKP setup verification
Write-Host "Verifying ZKP setup..." -ForegroundColor Yellow
npm run test:crypto:setup

Write-Host "All tests completed!" -ForegroundColor Green
