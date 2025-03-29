@echo off
REM rebuild-dev.bat - Completely rebuild development environment

echo Starting full development environment rebuild...

REM Stop and remove containers
echo Stopping containers...
docker-compose down

REM Remove images (force rebuild)
echo Removing Docker images...
for /f "tokens=*" %%i in ('docker images directorymonster* -q') do (
    docker rmi %%i
)

REM Clean node_modules if needed
REM echo Cleaning node_modules...
REM rd /s /q node_modules

REM Rebuild with no cache
echo Rebuilding containers (this may take a while)...
docker-compose build --no-cache

REM Start the containers
echo Starting containers...
docker-compose up -d

echo Waiting for services to start...
timeout /t 10 /nobreak > nul

REM Show container status
echo Container status:
docker-compose ps

echo Development environment has been completely rebuilt!
echo Access the app at http://localhost:3000
echo.
echo To view logs: docker-compose logs -f app
echo To stop: docker-compose down
