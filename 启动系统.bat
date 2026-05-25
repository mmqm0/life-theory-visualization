@echo off
chcp 65001 >nul
title 生命本质理论可视化系统 - 一键启动

echo ========================================
echo    生命本质理论可视化系统
echo ========================================
echo.

REM 检查 Docker 是否可用
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo [信息] 检测到 Docker
    echo [提示] 您可以使用 Docker Compose 一键启动
    echo [提示] 运行命令: docker-compose up -d
    echo.
)

REM 检查 Ollama 是否可用
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo [信息] 检测到 Ollama
    echo [信息] Ollama API: http://localhost:11434
    echo.
) else (
    echo [警告] 未检测到 Ollama
    echo [提示] 请先安装 Ollama: https://ollama.ai/
    echo.
)

echo ========================================
echo.
echo 请选择启动方式:
echo.
echo [1] 使用 Node.js 启动（开发模式）
echo [2] 使用 Docker 启动（推荐）
echo [3] 仅启动后端
echo [4] 仅启动前端
echo [0] 退出
echo.
set /p choice="请输入选项 (0-4): "

if "%choice%"=="1" goto start_node
if "%choice%"=="2" goto start_docker
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto start_frontend
if "%choice%"=="0" goto end

echo [错误] 无效的选项
pause
goto end

:start_node
echo.
echo ========================================
echo    启动 Node.js 开发环境
echo ========================================
echo.

REM 在新窗口启动后端
start "后端服务" cmd /k "cd /d %~dp0backend && call 启动后端.bat"

REM 等待几秒让后端启动
timeout /t 3 /nobreak >nul

REM 在新窗口启动前端
start "前端服务" cmd /k "cd /d %~dp0frontend && call 启动前端.bat"

echo.
echo [完成] 服务已启动！
echo.
echo 后端地址: http://localhost:8080
echo 前端地址: http://localhost:3000
echo.
goto end

:start_docker
echo.
echo [信息] 正在启动 Docker Compose...
docker-compose up -d
if %errorlevel% equ 0 (
    echo.
    echo [完成] Docker 服务已启动！
    echo.
    echo 后端地址: http://localhost:8080
    echo 前端地址: http://localhost:3000
) else (
    echo.
    echo [错误] Docker 启动失败！
)
echo.
goto end

:start_backend
echo.
cd /d %~dp0backend
call 启动后端.bat
goto end

:start_frontend
echo.
cd /d %~dp0frontend
call 启动前端.bat
goto end

:end
echo.
echo ========================================
echo    按任意键退出...
echo ========================================
pause >nul