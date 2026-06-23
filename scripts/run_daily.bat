@echo off
REM Token Harbor Daily Report - scheduled run
REM Triggered daily at 08:05 Beijing time by Windows Task Scheduler.
REM
REM Steps:
REM   1) fetch_supabase.mjs        -> daily_metrics.json
REM   2) generate_daily_report.mjs -> daily_report.md / executive_summary.txt / CSVs
REM   3) send_email.mjs            -> email report to ctt19881226@gmail.com (Resend)
REM
REM Logs are written to logs\daily_YYYY-MM-DD.log (Beijing date).

setlocal

set "PROJECT_ROOT=D:\claude\TokenHarbor"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "LOG_DIR=%PROJECT_ROOT%\logs"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Build a YYYY-MM-DD stamp from current local date (Beijing).
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set "LDT=%%I"
set "LOG_DATE=%LDT:~0,4%-%LDT:~4,2%-%LDT:~6,2%"
set "LOG_FILE=%LOG_DIR%\daily_%LOG_DATE%.log"

cd /d "%PROJECT_ROOT%"

echo ============================================================ >> "%LOG_FILE%"
echo Token Harbor Daily Report - run start %DATE% %TIME% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

echo. >> "%LOG_FILE%"
echo [Step 1] fetch_supabase.mjs >> "%LOG_FILE%"
"%NODE_EXE%" "%PROJECT_ROOT%\scripts\fetch_supabase.mjs" >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo [ERROR] fetch_supabase.mjs failed with exit code %ERRORLEVEL% >> "%LOG_FILE%"
    exit /b %ERRORLEVEL%
)

echo. >> "%LOG_FILE%"
echo [Step 2] generate_daily_report.mjs >> "%LOG_FILE%"
"%NODE_EXE%" "%PROJECT_ROOT%\scripts\generate_daily_report.mjs" >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo [ERROR] generate_daily_report.mjs failed with exit code %ERRORLEVEL% >> "%LOG_FILE%"
    exit /b %ERRORLEVEL%
)

echo. >> "%LOG_FILE%"
echo [Step 3] send_email.mjs >> "%LOG_FILE%"
"%NODE_EXE%" "%PROJECT_ROOT%\scripts\send_email.mjs" >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
    echo [ERROR] send_email.mjs failed with exit code %ERRORLEVEL% >> "%LOG_FILE%"
    exit /b %ERRORLEVEL%
)

echo. >> "%LOG_FILE%"
echo Token Harbor Daily Report - run done %DATE% %TIME% >> "%LOG_FILE%"

endlocal
exit /b 0
