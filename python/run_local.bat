@echo off
setlocal enabledelayedexpansion

REM Run the product scraper locally
REM Assumes Python environment is set up with all dependencies

REM Default values
set COUNT=10
set CATEGORIES="tech gadgets"
set MIN_PRICE=0
set MAX_PRICE=0
set OUTPUT_FILE=./data/products.json
set SEARCH_ENGINE=https://www.google.com/
set OLLAMA_HOST=localhost
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
if "%~1"=="--ollama-host" (
    set OLLAMA_HOST=%~2
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

REM Ensure output directory exists
if not exist "data" mkdir data

REM Run the script
echo Starting product scraper with the following parameters:
echo   Count: %COUNT%
echo   Categories: %CATEGORIES%
echo   Min Price: %MIN_PRICE%
echo   Max Price: %MAX_PRICE%
echo   Output File: %OUTPUT_FILE%
echo   Search Engine: %SEARCH_ENGINE%
echo   Ollama Host: %OLLAMA_HOST%
echo   Ollama Model: %OLLAMA_MODEL%

REM Build command
set CMD=python run_scraper.py --count %COUNT% --output %OUTPUT_FILE% --search-engine "%SEARCH_ENGINE%" --ollama-host %OLLAMA_HOST% --ollama-model %OLLAMA_MODEL%

REM Add optional parameters if non-zero
if %MIN_PRICE% GTR 0 (
    set CMD=!CMD! --min-price %MIN_PRICE%
)

if %MAX_PRICE% GTR 0 (
    set CMD=!CMD! --max-price %MAX_PRICE%
)

REM Add categories (if not empty)
if not "%CATEGORIES%"=="" (
    set CMD=!CMD! --categories %CATEGORIES%
)

REM Execute command
echo Running command: !CMD!
!CMD!