@echo off
REM Script to run the categories E2E test with enhanced debugging

REM Create logs directories if they don't exist
mkdir debug-logs 2>nul
mkdir html-dumps 2>nul

REM Clear old logs
echo Clearing old debug logs...
del /q debug-logs\*.*
del /q html-dumps\*.*

REM Set debug environment variable
set DEBUG=true

REM Set longer timeouts
set PUPPETEER_TIMEOUT=60000

REM Run the test with detailed output
echo Running categories E2E test with enhanced debugging...
call npm run test:e2e:categories -- --verbose > categories-test-output.log 2>&1

REM Summary of logs
echo ------------------------------------
echo Test complete. Debug logs summary:
echo ------------------------------------
echo HTML dumps: 
dir /b html-dumps | find /c /v ""
echo Debug logs: 
dir /b debug-logs | find /c /v ""
echo Log locations:
echo   - HTML dumps: .\html-dumps\
echo   - Debug logs: .\debug-logs\
echo   - Test output: .\categories-test-output.log
echo ------------------------------------

REM Keep console open
pause
