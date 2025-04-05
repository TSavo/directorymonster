# docker-do-it-all.ps1 - The "I can't be arsed" Docker script for Windows

Write-Host "🐳 DirectoryMonster - Dockerizing EVERYTHING for you" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Check Node.js version
Write-Host "🔍 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
$versionNumber = $nodeVersion.Substring(1) -split '\.'
$majorVersion = [int]$versionNumber[0]

if ($majorVersion -lt 14) {
    Write-Host "❌ Error: Node.js version $nodeVersion is not supported." -ForegroundColor Red
    Write-Host "❌ DirectoryMonster requires Node.js version 14.x or higher." -ForegroundColor Red
    Write-Host "❌ Please upgrade your Node.js installation: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Node.js version $nodeVersion meets requirements (>= 14.x)." -ForegroundColor Green
}

# Build and start the Docker containers
Write-Host "🏗️ Building and starting Docker containers..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.all-in-one.yml up --build -d

Write-Host "✨ DirectoryMonster is now running in Docker!" -ForegroundColor Green
Write-Host "📱 Access the application at: http://localhost:3000" -ForegroundColor Cyan
