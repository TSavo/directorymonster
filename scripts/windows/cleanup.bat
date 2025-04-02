@echo off
echo Cleaning up temporary files...

REM Remove Python cache files
echo Removing Python cache files...
del /s /q __pycache__\*.pyc
rmdir /s /q __pycache__

REM Remove log files
echo Removing log files...
del /q *.log
del /q python\*.log
del /q seo_data\logs\*.log

REM Remove temporary test output files
echo Removing test output files...
del /q *_test_output.log
del /q *_output.log
del /q test_results.log
del /q build.log
del /q cleanup.log
del /q restart.log
del /q seed*.log

REM Remove any debug files
echo Removing debug files...
del /q python\pre_extraction_debug_*.json
del /q python\json_error_*.json
del /q python\api_request_*.json
del /q python\api_error_*.json

REM Remove SEO data temporary files
echo Cleaning up SEO data files...
del /q seo_data\processed\*.json
del /q seo_data\screenshots\*.gif

echo Cleanup complete!
