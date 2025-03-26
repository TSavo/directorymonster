@echo off
setlocal enabledelayedexpansion

REM Script to set up a Python virtual environment and install requirements

REM Default values
set VENV_DIR=venv
set REQUIREMENTS_FILE=requirements.txt

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_parsing
if "%~1"=="--venv-dir" (
    set VENV_DIR=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--requirements" (
    set REQUIREMENTS_FILE=%~2
    shift
    shift
    goto :parse_args
)
echo Unknown option: %~1
exit /b 1

:done_parsing

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.8 or higher.
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set pyver=%%i
echo Detected Python version: %pyver%

REM Extract major and minor version
for /f "tokens=1,2 delims=." %%a in ("%pyver%") do (
    set pymajor=%%a
    set pyminor=%%b
)

REM Check if version is at least 3.8
if %pymajor% LSS 3 (
    echo This script requires Python 3.8 or higher.
    echo Current Python version: %pyver%
    exit /b 1
)

if %pymajor% EQU 3 (
    if %pyminor% LSS 8 (
        echo This script requires Python 3.8 or higher.
        echo Current Python version: %pyver%
        exit /b 1
    )
)

REM Check if virtual environment already exists
if exist "%VENV_DIR%" (
    echo Virtual environment already exists at %VENV_DIR%
    echo To recreate it, delete the directory first.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment in %VENV_DIR%...
python -m venv %VENV_DIR%

REM Check if creation was successful
if %ERRORLEVEL% NEQ 0 (
    echo Failed to create virtual environment.
    exit /b 1
)

REM Activate virtual environment and install requirements
echo Installing requirements from %REQUIREMENTS_FILE%...
call %VENV_DIR%\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r %REQUIREMENTS_FILE%

REM Check if installation was successful
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install requirements.
    exit /b 1
)

echo Virtual environment setup complete!
echo To activate it, run: activate_venv.bat
echo To deactivate it, run: deactivate

REM Deactivate at the end
deactivate

endlocal