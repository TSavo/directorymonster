@echo off
REM Enhanced E2E test runner for Windows

echo =======================================
echo    DirectoryMonster E2E Test Runner   
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

REM Run the first user setup test first
echo.
echo Running first user setup test...
npx jest "tests/e2e/first-user.test.js" --testTimeout=60000
if %errorlevel% neq 0 (
    echo First user setup test failed. Aborting remaining tests.
    exit /b 1
)

REM Run the smoke test first to verify basic functionality
echo.
echo Running Smoke Tests...
npx jest "tests/e2e/smoketest.test.js" --testTimeout=60000 --verbose

REM Store the smoke test result
set SMOKE_TEST_RESULT=%errorlevel%

REM Only run the remaining E2E tests if smoke test passed
if %SMOKE_TEST_RESULT% equ 0 (
    echo.
    echo Smoke tests passed! Running remaining E2E tests...
    npx jest "tests/e2e/login.test.js" "tests/e2e/categories.test.js" --testTimeout=60000 --verbose
) else (
    echo.
    echo Smoke tests failed. Skipping remaining tests.
    exit /b 1
)

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
