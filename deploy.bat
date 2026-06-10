@echo off
echo [1/3] Building...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed
    pause
    exit /b 1
)
echo Build OK
echo.

set SERVER_USER=root
set SERVER_HOST=hellokiki.cn
set SERVER_PATH=/www/wwwroot/hellokiki.cn/zfj-tools/

echo [2/3] Uploading...
scp -r "dist/." "%SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%"
if %errorlevel% neq 0 (
    echo Upload failed
    pause
    exit /b 1
)
echo Upload OK
echo.

echo [3/3] Done - https://hellokiki.cn
pause
