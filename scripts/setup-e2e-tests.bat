@echo off
echo Setting up environment for E2E tests...

REM Check if Redis container is running
echo Checking Redis status...
docker ps | findstr directorymonster-redis-1
if %ERRORLEVEL% NEQ 0 (
  echo Redis is not running! Starting containers...
  docker-compose up -d
  echo Waiting for Redis to start...
  timeout /t 5 /nobreak
)

REM Set environment variables for test
set NODE_ENV=development
set USE_MEMORY_FALLBACK=true

REM Seed Redis with initial data
echo Seeding Redis database...
node scripts/seed-redis.js

REM Wait for any pending operations to complete
timeout /t 2 /nobreak

echo Setup complete! You can now run the E2E tests.
