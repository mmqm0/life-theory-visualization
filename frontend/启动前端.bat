@echo off
chcp 65001 >nul
title 生命本质理论可视化系统 - 前端

echo ========================================
echo    生命本质理论可视化系统 - 前端
echo ========================================
echo.

REM 检查是否存在配置文件
if not exist ".env" (
    echo [提示] 未找到 .env 配置文件
    echo [提示] 正在从 .env.example 创建默认配置...
    copy ".env.example" ".env" >nul
    echo [完成] 已创建默认配置文件
    echo.
)

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [提示] 未找到 node_modules
    echo [提示] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败！
        pause
        exit /b 1
    )
    echo [完成] 依赖安装成功
    echo.
)

REM 启动前端服务
echo [信息] 正在启动前端服务...
echo [信息] 前端地址: http://localhost:3000
echo.
echo [提示] 按 Ctrl+C 可停止服务
echo.
echo ========================================
echo.

call npm start

pause