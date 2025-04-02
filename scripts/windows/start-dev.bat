@echo off
REM start-dev.bat - Start development environment with hot reloading

echo Starting development environment with hot reloading...

REM Set environment variables for hot reloading
set WATCHPACK_POLLING=true
set CHOKIDAR_USEPOLLING=true

REM Start the containers with hot reloading enabled
echo Starting containers with hot reloading...
docker-compose up -d

echo Waiting for services to start...
timeout /t 10 /nobreak > nul

REM Show container status
echo Container status:
docker-compose ps

echo Development environment is ready!
echo Access the app at http://localhost:3000
echo.
echo To watch logs in real-time: docker-compose logs -f app
echo To stop: docker-compose down
