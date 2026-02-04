@echo off
setlocal enabledelayedexpansion

REM User Deletion Script Runner for Windows
REM This script deletes specified users from both DynamoDB and Cognito

echo ==========================================
echo USER DELETION SCRIPT
echo ==========================================
echo.

REM Check if .env file exists
if not exist "..\\.env" (
    echo Error: .env file not found in backend directory
    echo Please create a .env file with:
    echo   TABLE_NAME=your-dynamodb-table-name
    echo   USER_POOL_ID=your-cognito-user-pool-id
    exit /b 1
)

echo Loading environment variables...

REM Load environment variables from .env file
for /f "usebackq tokens=1,* delims==" %%a in ("..\\.env") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        set "%%a=%%b"
    )
)

REM Check required variables
if not defined TABLE_NAME (
    echo Error: TABLE_NAME not set in .env
    exit /b 1
)

if not defined USER_POOL_ID (
    echo Warning: USER_POOL_ID not set in .env
    echo Users will only be deleted from DynamoDB, not Cognito
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /i not "!continue!"=="y" (
        exit /b 1
    )
)

echo.
echo Configuration:
echo   Table: %TABLE_NAME%
if defined USER_POOL_ID (
    echo   User Pool: %USER_POOL_ID%
) else (
    echo   User Pool: Not set
)
echo.
echo WARNING: This will permanently delete the following users:
echo   - support@activewave.co.za
echo   - iverson.eulises@moonfee.com
echo.
echo This action CANNOT be undone!
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Deletion cancelled
    exit /b 0
)

echo.
echo Starting deletion process...
echo.

REM Run the Node.js script
node delete-users.js

echo.
echo Script execution complete!
pause
