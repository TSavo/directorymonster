@echo off
setlocal enabledelayedexpansion

REM First, check if Ollama service is running
echo Checking if Ollama service is running...
docker ps | findstr "ollama-server" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting Ollama server...
    docker-compose up -d ollama
    
    echo Waiting for Ollama to start...
    echo This may take up to 30 seconds...
    timeout /t 30 >nul
) else (
    echo Ollama server is already running.
)

REM Check if model exists (default to llama3:latest)
set OLLAMA_MODEL=llama3:latest
echo Checking if model %OLLAMA_MODEL% is already downloaded...
docker exec ollama-server ollama list | findstr "%OLLAMA_MODEL%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Model not found, pulling %OLLAMA_MODEL%...
    docker exec ollama-server ollama pull "%OLLAMA_MODEL%"
) else (
    echo Model %OLLAMA_MODEL% is already downloaded.
)

REM Run the scraper with fixed parameters for simplicity
echo Running scraper with default parameters...
docker-compose run --rm product-scraper --count 5 --output /data/products.json --search-engine https://www.google.com/ --ollama-host ollama --ollama-model llama3:latest --categories outdoor gear

echo Scraper completed. Results are in ./data/products.json