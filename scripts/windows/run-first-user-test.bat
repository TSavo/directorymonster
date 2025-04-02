@echo off
REM Script to run the first user E2E test

REM Stop running containers
echo Stopping Docker containers...
docker-compose down

REM Start containers
echo Starting Docker containers...
docker-compose up -d

REM Wait for the server to be ready
echo Waiting for server to start...
timeout /t 10

REM Clear users via API
echo Clearing users via API...
curl -X POST http://localhost:3000/api/test/clear-users

REM Run the first user test
echo Running first user E2E test...
npx jest --testPathPattern=tests/e2e/first-user.test.js
