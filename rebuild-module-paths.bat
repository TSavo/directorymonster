@echo off
echo ========================================
echo DirectoryMonster Module Path Rebuild Tool
echo ========================================
echo.
echo This script will help fix module resolution issues in Docker.
echo.

echo 1. Rebuilding component exports...
node scripts/rebuild-component-exports.js
if %ERRORLEVEL% NEQ 0 (
  echo Error rebuilding component exports
  exit /b 1
)

echo.
echo 2. Stopping Docker containers...
docker-compose down
if %ERRORLEVEL% NEQ 0 (
  echo Error stopping Docker containers
  exit /b 1
)

echo.
echo 3. Rebuilding Docker containers...
docker-compose build --no-cache
if %ERRORLEVEL% NEQ 0 (
  echo Error rebuilding Docker containers
  exit /b 1
)

echo.
echo 4. Starting Docker containers...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
  echo Error starting Docker containers
  exit /b 1
)

echo.
echo 5. Creating test sites...
node scripts/create-test-sites.js
if %ERRORLEVEL% NEQ 0 (
  echo Error creating test sites
  exit /b 1
)

echo.
echo ========================================
echo Module path rebuild complete!
echo ========================================
echo.
echo You can now check if the Docker containers are working correctly by:
echo 1. Running the E2E tests: npm run test:e2e
echo 2. Visiting http://localhost:3000/admin/sites
echo.
echo If you still see module resolution errors:
echo 1. Check the container logs: docker-compose logs app
echo 2. Try updating import paths to use relative imports
echo 3. Verify Docker volumes are mounted correctly
echo.

echo Press any key to exit...
pause > nul
