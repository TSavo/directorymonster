# verify-all.ps1 - Verify EVERYTHING

Write-Host "DirectoryMonster - Verifying EVERYTHING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

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

# Verify ZKP setup
Write-Host "Verifying ZKP setup..." -ForegroundColor Yellow
npm run test:crypto:setup

# Verify file integrity
Write-Host "Verifying file integrity..." -ForegroundColor Yellow
npm run security:verify

# Run security audit
Write-Host "Running security audit..." -ForegroundColor Yellow
npm run security:audit

Write-Host "All verification checks completed!" -ForegroundColor Green
