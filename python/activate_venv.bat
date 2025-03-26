@echo off
setlocal enabledelayedexpansion

REM Script to activate the Python virtual environment

REM Default values
set VENV_DIR=venv

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_parsing
if "%~1"=="--venv-dir" (
    set VENV_DIR=%~2
    shift
    shift
    goto :parse_args
)
echo Unknown option: %~1
exit /b 1

:done_parsing

REM Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo Virtual environment not found at %VENV_DIR%
    echo Please run setup_venv.bat first to create it.
    exit /b 1
)

REM Check if activate script exists
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo Activation script not found in %VENV_DIR%\Scripts
    echo The virtual environment may be corrupted.
    exit /b 1
)

REM Activate the virtual environment
echo Activating virtual environment from %VENV_DIR%...
call %VENV_DIR%\Scripts\activate.bat

REM Check if activation was successful
if not defined VIRTUAL_ENV (
    echo Failed to activate virtual environment.
    exit /b 1
)

echo Virtual environment activated!
echo You are now using Python from: %VIRTUAL_ENV%
echo Python version:
python --version
echo.
echo To deactivate, type: deactivate
echo.
echo You can now run the product scraper:
echo python run_scraper.py --count 5 --categories "outdoor gear"
echo.

REM Don't use endlocal here, as it would undo the environment changes
REM made by activate.bat. Instead, we'll pass control back to the
REM command prompt with the virtual environment active.