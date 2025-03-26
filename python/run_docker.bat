@echo off
setlocal enabledelayedexpansion

REM Script to run the product scraper with Docker Compose

REM Default values
set COUNT=5
set CATEGORIES="tech gadgets"
set MIN_PRICE=0
set MAX_PRICE=0
set OUTPUT_FILE=/data/products.json
set SEARCH_ENGINE=https://www.google.com/
set OLLAMA_MODEL=llama3:latest

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_parsing
if "%~1"=="--count" (
    set COUNT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--categories" (
    set CATEGORIES=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--min-price" (
    set MIN_PRICE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--max-price" (
    set MAX_PRICE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--output" (
    set OUTPUT_FILE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--search-engine" (
    set SEARCH_ENGINE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--ollama-model" (
    set OLLAMA_MODEL=%~2
    shift
    shift
    goto :parse_args
)
echo Unknown option: %~1
exit /b 1

:done_parsing

REM First, check if Ollama service is running
echo Checking if Ollama service is running...
docker ps | findstr "ollama-server" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting Ollama server...
    docker-compose up -d ollama
    
    echo Waiting for Ollama to start...
    timeout /t 10 >nul
) else (
    echo Ollama server is already running.
)

REM Check if model exists
echo Checking if model %OLLAMA_MODEL% is already downloaded...
docker exec ollama-server ollama list | findstr "%OLLAMA_MODEL%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Model not found, pulling %OLLAMA_MODEL%...
    docker exec ollama-server ollama pull "%OLLAMA_MODEL%"
) else (
    echo Model %OLLAMA_MODEL% is already downloaded.
)

REM Build command with parameters
set CMD=--count %COUNT% --output %OUTPUT_FILE% --search-engine "%SEARCH_ENGINE%" --ollama-host ollama --ollama-model %OLLAMA_MODEL%

REM Add optional parameters if non-zero
if %MIN_PRICE% GTR 0 (
    set CMD=!CMD! --min-price %MIN_PRICE%
)

if %MAX_PRICE% GTR 0 (
    set CMD=!CMD! --max-price %MAX_PRICE%
)

REM Add categories - handle quotes carefully
if not "%CATEGORIES%"=="" (
    REM Remove surrounding quotes if present
    set CATEGORIES_FIXED=%CATEGORIES%
    set CATEGORIES_FIXED=!CATEGORIES_FIXED:"=!
    
    REM Pass categories parameter properly
    set CMD=!CMD! --categories !CATEGORIES_FIXED!
)
)

echo Running scraper with parameters: !CMD!

REM Run the scraper
docker-compose run --rm product-scraper !CMD!

echo Scraper completed. Results are in ./data/products.json