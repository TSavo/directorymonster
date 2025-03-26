@echo off
setlocal enabledelayedexpansion

REM Script to stop the Ollama Docker container

set CONTAINER_NAME=ollama-server

echo Checking if container exists...
docker ps -a | findstr "%CONTAINER_NAME%" >nul
if %ERRORLEVEL% EQU 0 (
    echo Stopping container '%CONTAINER_NAME%'...
    docker stop "%CONTAINER_NAME%"
    echo Container stopped but NOT removed
    echo The downloaded models are still preserved in the Docker volume
    echo Run run_ollama_docker.bat again to restart
) else (
    echo Container '%CONTAINER_NAME%' not found
)