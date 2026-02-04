@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM User Deletion Script - ALL ENVIRONMENTS (DEV, QA, PROD)
REM This script deletes specified users from DynamoDB and Cognito
REM across ALL environments: dev, qa, and prod
REM ============================================================

echo.
echo ============================================================
echo    USER DELETION SCRIPT - ALL ENVIRONMENTS
echo    WARNING: This will delete data from DEV, QA, and PROD!
echo ============================================================
echo.

REM List the users that will be deleted
echo Users that will be PERMANENTLY DELETED:
echo    - famous.ronin@moonfee.com
echo    - tj.parv@moonfee.com
echo    - Chibvuriesther@gmail.com
echo    - me@you.comd
echo    - maverick.hung@moonfee.com
echo    - kinzy.makhyla@moonfee.com
echo    - velma.shelsey@moonfee.com
echo    - maynor.virgilio@moonfee.com
echo    - malka.elaya@moonfee.com
echo    - sigourney.aylinne@moonfee.com
echo    - benjamyn.jamesmichael@moonfee.com
echo    - jayven.johncarlos@moonfee.com
echo.

echo Environments:
echo    - DEV:  exam-platform-data-dev / af-south-1_DujUfW9wf
echo    - QA:   exam-platform-data-qa / af-south-1_fcKpAgQe3
echo    - PROD: exam-platform-data-prod / af-south-1_MxhGAZIEL
echo.

echo This action will DELETE:
echo    - User profiles
echo    - Exam attempts and history
echo    - User statistics and progress
echo    - Bookmarks
echo    - Leaderboard entries
echo    - Cognito user accounts
echo    - All other user-related data
echo.

echo ============================================================
echo    THIS ACTION CANNOT BE UNDONE!
echo ============================================================
echo.

set /p confirm="Type 'DELETE ALL' to confirm deletion across ALL environments: "

if not "%confirm%"=="DELETE ALL" (
    echo.
    echo Deletion cancelled. You must type 'DELETE ALL' exactly.
    echo.
    pause
    exit /b 0
)

echo.
echo Compiling TypeScript...
echo.

REM Compile the TypeScript file
call npx tsc delete-users-all-envs.ts --esModuleInterop --module commonjs --target es2020 --skipLibCheck

if %errorlevel% neq 0 (
    echo.
    echo ERROR: TypeScript compilation failed!
    echo Please ensure you have TypeScript and AWS SDK installed:
    echo    npm install -g typescript
    echo    npm install @aws-sdk/client-dynamodb @aws-sdk/client-cognito-identity-provider @aws-sdk/util-dynamodb
    echo.
    pause
    exit /b 1
)

echo Compilation successful!
echo.
echo Starting deletion process...
echo.

REM Run the compiled JavaScript
node delete-users-all-envs.js

if %errorlevel% neq 0 (
    echo.
    echo WARNING: Script completed with errors. Check the output above.
    echo.
) else (
    echo.
    echo Script execution completed successfully!
    echo.
)

pause
