@echo off
setlocal enabledelayedexpansion

REM Script to run Ollama in Docker with GPU support for Windows

REM Default values
set OLLAMA_PORT=11434
set MODEL=llama3:latest
set CONTAINER_NAME=ollama-server
set VOLUME_NAME=ollama-models

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_parsing
if "%~1"=="--port" (
    set OLLAMA_PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--model" (
    set MODEL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--container-name" (
    set CONTAINER_NAME=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--volume-name" (
    set VOLUME_NAME=%~2
    shift
    shift
    goto :parse_args
)
echo Unknown option: %~1
exit /b 1

:done_parsing

REM Check if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Nvidia runtime is available (for GPU support)
set NVIDIA_FLAG=
docker info 2>nul | findstr "Runtimes:.*nvidia" >nul
if %ERRORLEVEL% EQU 0 (
    echo NVIDIA runtime detected, enabling GPU support
    set NVIDIA_FLAG=--gpus all
) else (
    where nvidia-smi >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo NVIDIA GPU detected, enabling GPU support
        set NVIDIA_FLAG=--gpus all
    ) else (
        echo Warning: NVIDIA GPU not detected. Ollama will run on CPU only.
    )
)

REM Check if container already exists
docker ps -a | findstr "%CONTAINER_NAME%" >nul
if %ERRORLEVEL% EQU 0 (
    echo Container '%CONTAINER_NAME%' already exists.
    
    REM Check if container is running
    docker ps | findstr "%CONTAINER_NAME%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo Container is already running. Stopping...
        docker stop "%CONTAINER_NAME%"
    )
    
    echo Removing existing container...
    docker rm "%CONTAINER_NAME%"
)

REM Create a named volume for persistent storage
docker volume ls | findstr "%VOLUME_NAME%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Creating volume '%VOLUME_NAME%'...
    docker volume create "%VOLUME_NAME%"
)

REM Show where the volume is stored
echo Volume location information:
docker volume inspect "%VOLUME_NAME%"

REM Run Ollama container with explicit volume mapping
echo Starting Ollama container...
docker run -d ^
    --name "%CONTAINER_NAME%" ^
    %NVIDIA_FLAG% ^
    -p "%OLLAMA_PORT%:11434" ^
    -v "%VOLUME_NAME%:/root/.ollama" ^
    -e "OLLAMA_HOST=0.0.0.0" ^
    -e "CUDA_VISIBLE_DEVICES=0" ^
    ollama/ollama

REM Wait for Ollama to start
echo Waiting for Ollama to start...
set MAX_RETRIES=30
set RETRY_COUNT=0

:check_ollama
curl -s "http://localhost:%OLLAMA_PORT%/api/tags" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /a RETRY_COUNT+=1
    if !RETRY_COUNT! GEQ %MAX_RETRIES% (
        echo Timed out waiting for Ollama to start
        exit /b 1
    )
    echo Waiting for Ollama API to become available... (attempt !RETRY_COUNT!/%MAX_RETRIES%)
    timeout /t 2 >nul
    goto :check_ollama
)

echo Ollama server is running!

REM Pull the specified model only if it doesn't exist
echo Checking if model %MODEL% is already downloaded...
docker exec "%CONTAINER_NAME%" ollama list | findstr "%MODEL%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Model not found, pulling %MODEL%...
    docker exec "%CONTAINER_NAME%" ollama pull "%MODEL%"
) else (
    echo Model %MODEL% is already downloaded. No need to pull again.
)

echo ========================================================
echo Ollama is now running with the %MODEL% model
echo Server URL: http://localhost:%OLLAMA_PORT%
echo.
echo To use this server with the product scraper, use:
echo   python run_scraper.py --ollama-host localhost --ollama-model %MODEL%
echo.
echo To stop the server, run:
echo   docker stop %CONTAINER_NAME%
echo ========================================================

REM Print logs
echo Showing container logs (press Ctrl+C to exit):
docker logs -f "%CONTAINER_NAME%"