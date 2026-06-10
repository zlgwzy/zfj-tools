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

echo Fixing permissions...
ssh "%SERVER_USER%@%SERVER_HOST%" "find %SERVER_PATH% -not -name '.user.ini' -type d -exec chmod 755 {} + && find %SERVER_PATH% -not -name '.user.ini' -type f -exec chmod 644 {} +"
if %errorlevel% neq 0 (
    echo Permission fix warning
)

echo Upload OK
echo.

echo [3/3] Done - https://hellokiki.cn
pause
