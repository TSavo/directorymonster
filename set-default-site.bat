@echo off
REM Script to set the default site for DirectoryMonster
REM Usage: set-default-site.bat <site-slug>
REM Example: set-default-site.bat hiking-gear

if "%1"=="" (
  echo Error: Please provide a site slug.
  echo Usage: set-default-site.bat ^<site-slug^>
  echo Example: set-default-site.bat hiking-gear
  exit /b 1
)

echo Setting default site to "%1"...
docker-compose -f docker-compose.dev.yml exec app node scripts/set-default-site.js %1
