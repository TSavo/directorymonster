@echo off
REM rebuild-docker-win.bat - Windows-specific version of the rebuild script

echo ===== DirectoryMonster Docker Rebuild Script =====

echo Step 1: Stopping all running containers...
docker-compose down

echo Step 2: Fixing Redis connection configuration...
node scripts\fix-redis-connection.js

echo Step 3: Removing any leftover containers...
FOR /F "tokens=*" %%a IN ('docker ps -a -q') DO (
    echo Removing container: %%a
    docker rm -f %%a 2>NUL
)

echo Step 4: Removing DirectoryMonster images...
FOR /F "tokens=*" %%a IN ('docker images "directorymonster*" -q') DO (
    echo Removing image: %%a
    docker rmi %%a 2>NUL
)

echo Step 5: Rebuilding Docker containers...
docker-compose build

echo Step 6: Starting containers...
docker-compose up -d

echo Step 7: Waiting for services to start...
timeout /t 15

echo Step 8: Checking container status...
docker-compose ps

echo Step 9: Seeding test data...
node scripts\create-test-sites.js

echo Step 10: Checking application logs...
docker-compose logs --tail=30 app

echo.
echo ===== Docker rebuild complete! =====
echo.
echo You can now run the E2E tests with:
echo npm run test:e2e
