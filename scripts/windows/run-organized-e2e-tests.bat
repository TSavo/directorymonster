@echo off
REM Organized E2E test runner for DirectoryMonster
REM Uses the new structured approach with separate test files per page feature

echo =======================================
echo    DirectoryMonster E2E Test Runner   
echo    (Organized Approach)
echo =======================================

REM Check if server is running
echo.
echo Checking if server is running...
curl -s http://localhost:3000/api/healthcheck >nul 2>&1
if %errorlevel% neq 0 (
    echo Server not detected. Starting server in background...
    start /b npm run dev
    
    REM Wait for server to start
    echo Waiting for server to start...
    for /l %%i in (1, 1, 30) do (
        curl -s http://localhost:3000/api/healthcheck >nul 2>&1
        if !errorlevel! equ 0 (
            echo Server started successfully!
            goto :server_started
        )
        
        if %%i equ 30 (
            echo Server failed to start in time. Aborting.
            exit /b 1
        )
        
        echo|set /p=".
        timeout /t 1 >nul
    )
) else (
    echo Server is already running.
)

:server_started

REM Verify and prepare seed data
echo.
echo Verifying seed data...
node scripts/verify-seed-data.js
if %errorlevel% neq 0 (
    echo Failed to verify or create seed data. Some tests may fail.
    echo Continuing with tests anyway...
)

REM Run all organized E2E tests using the new Jest configuration
echo.
echo Running organized E2E tests...
npm run test:e2e:organized

REM Store the test result
set TEST_RESULT=%errorlevel%

REM Final summary
echo.
echo =======================================
if %TEST_RESULT% equ 0 (
    echo All E2E tests completed successfully!
) else (
    echo Some E2E tests failed. Check the logs for details.
)
echo =======================================
