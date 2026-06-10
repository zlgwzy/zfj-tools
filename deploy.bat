@echo off
chcp 65001 >nul
echo ================================
echo   执法局工具箱 - 部署脚本
echo ================================
echo.

REM 构建项目
echo [1/3] 正在构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败，终止部署
    pause
    exit /b 1
)
echo 构建成功
echo.

REM 服务器配置
set SERVER_USER=root
set SERVER_HOST=hellokiki.cn
set SERVER_PATH=/www/wwwroot/hellokiki.cn/zfj-tools/

REM 上传到服务器
echo [2/3] 正在上传到服务器...
scp -r dist/* %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%
if %errorlevel% neq 0 (
    echo 上传失败，请检查服务器连接
    pause
    exit /b 1
)
echo 上传成功
echo.

REM 清理
echo [3/3] 部署完成
echo.
echo 已部署到：https://hellokiki.cn
pause
