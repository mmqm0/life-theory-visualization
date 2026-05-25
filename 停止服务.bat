@echo off
chcp 65001 >nul
title 停止服务 - 生命本质理论可视化系统

echo ========================================
echo    停止生命本质理论可视化系统
echo ========================================
echo.

echo [1] 停止 Docker Compose
echo [2] 停止 Node.js 进程
echo [3] 停止所有服务
echo [0] 退出
echo.
set /p choice="请输入选项 (0-3): "

if "%choice%"=="1" goto stop_docker
if "%choice%"=="2" goto stop_node
if "%choice%"=="3" goto stop_all
if "%choice%"=="0" goto end

echo [错误] 无效的选项
pause
goto end

:stop_docker
echo.
echo [信息] 正在停止 Docker Compose...
docker-compose down
echo [完成] Docker 服务已停止
goto end

:stop_node
echo.
echo [信息] 正在停止 Node.js 进程...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [完成] Node.js 进程已停止
) else (
    echo [提示] 没有找到运行的 Node.js 进程
)
goto end

:stop_all
echo.
echo [信息] 正在停止所有服务...

echo.
echo [1/2] 停止 Docker Compose...
docker-compose down 2>nul

echo.
echo [2/2] 停止 Node.js 进程...
taskkill /F /IM node.exe 2>nul

echo.
echo [完成] 所有服务已停止
goto end

:end
echo.
echo ========================================
echo    按任意键退出...
echo ========================================
pause >nul