@echo off
chcp 65001 >nul
title 打包 - 生命本质理论可视化系统

echo ========================================
echo    生命本质理论可视化系统 - 打包工具
echo ========================================
echo.

REM 创建打包目录
if not exist "dist" mkdir dist
if not exist "dist\backend" mkdir dist\backend
if not exist "dist\frontend" mkdir dist\frontend
if not exist "dist\docs" mkdir dist\docs

echo [步骤 1/5] 检查环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js！
    echo [提示] 请先安装 Node.js 20 或更高版本
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm！
    pause
    exit /b 1
)

echo [完成] 环境检查通过
echo.

echo [步骤 2/5] 安装依赖...

echo.
echo [后端] 安装依赖...
cd backend
if not exist "node_modules" (
    call npm install
)
cd ..

echo.
echo [前端] 安装依赖...
cd frontend
if not exist "node_modules" (
    call npm install
)
cd ..

echo.
echo [完成] 依赖安装
echo.

echo [步骤 3/5] 打包前端（构建静态文件）...
cd frontend
echo [信息] 正在构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败！
    cd ..
    pause
    exit /b 1
)
cd ..

echo [完成] 前端构建成功
echo.

echo [步骤 4/5] 复制文件到打包目录...

echo [信息] 复制后端文件...
xcopy /E /I /Y "backend\*" "dist\backend\" >nul
del "dist\backend\.env" >nul 2>nul
del "dist\backend\ai-config.json" >nul 2>nul
del "dist\backend\test-*.js" >nul 2>nul

echo [信息] 复制前端构建文件...
if exist "frontend\build" (
    xcopy /E /I /Y "frontend\build" "dist\frontend\" >nul
)

echo [信息] 复制启动脚本...
copy "启动系统.bat" "dist\" >nul
copy "backend\启动后端.bat" "dist\backend\" >nul
copy "frontend\启动前端.bat" "dist\frontend\" >nul

echo [信息] 复制配置示例...
copy "backend\.env.example" "dist\backend\.env" >nul
copy "frontend\.env.example" "dist\frontend\.env" >nul

echo [信息] 复制文档...
copy "README.md" "dist\docs\" >nul
copy "部署指南.md" "dist\docs\" >nul 2>nul

echo [信息] 复制 Docker 文件...
copy "docker-compose.yml" "dist\" >nul
xcopy /E /I /Y "docker" "dist\docker\" >nul

echo [完成] 文件复制
echo.

echo [步骤 5/5] 创建说明文件...

(
echo 生命本质理论可视化系统
echo =========================
echo.
echo 版本: 1.0.0
echo 打包日期: %date% %time%
echo.
echo 快速开始:
echo 1. 双击运行 '启动系统.bat'
echo 2. 或使用 Docker: docker-compose up -d
echo.
echo 更多说明请查看 docs\README.md
) > "dist\说明.txt"

echo [完成] 打包完成！
echo.
echo ========================================
echo.
echo 打包目录: %~dp0dist
echo.
echo 包含内容:
echo - backend/        后端服务
echo - frontend/       前端静态文件
echo - docker/         Docker 配置
echo - docs/           文档
echo - 启动系统.bat   一键启动脚本
echo.
echo ========================================
echo.
echo [提示] 您可以将 dist 目录压缩为 ZIP 分发给用户
echo.
pause