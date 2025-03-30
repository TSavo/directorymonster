@echo off
REM dev-reload.bat - Quickly restart the development environment

echo Starting development environment refresh...

REM Stop the containers but keep volumes
echo Stopping containers...
docker-compose -f docker-compose.dev.yml down

REM Restart containers
echo Starting containers...
docker-compose up -f docker-compose.dev.yml -d

echo Waiting for services to start...
timeout /t 5 /nobreak > nul

REM Show container status
echo Container status:
docker-compose ps

echo Development environment is ready!
echo Access the app at http://localhost:3000
echo.
echo To view logs: docker-compose logs -f app
echo To stop: docker-compose down
