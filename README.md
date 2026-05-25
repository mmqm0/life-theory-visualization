# 生命本质理论可视化系统

基于生命熵变全程推演的完整体系框架可视化平台。

## 技术栈

- **前端**: React 18 + Chart.js + IndexedDB
- **后端**: Node.js + Express + Sequelize
- **数据库**: PostgreSQL (结构化数据) + Neo4j (知识图谱)
- **缓存**: Redis
- **容器**: Docker

## 功能模块

### 核心功能
- 🔬 **熵变动态模拟器**: 实时参数调节与熵值计算
- 🧠 **知识图谱导航**: 可拖拽概念网络与理论关联
- 🧬 **生命形态构建器**: 自定义形态设计与评估
- ✅ **理论验证评分系统**: 多维度验证与报告生成
- 📚 **案例库管理**: 案例添加、搜索与分类
- 📤 **数据导出与分享**: 图片、报告、链接生成

### AI集成
- 🌐 **本地 Ollama 支持**: 完全本地化的 AI 对话和分析
- ☁️ **DeepSeek API 文本分析**
- ☁️ **阿里云百炼 API**
- 🔍 **Google 搜索 API**
- 🔍 **SerpAPI 联网搜索**

## 快速开始

### Ollama 本地 AI 配置（推荐）

本项目优先支持本地 Ollama AI 服务，无需联网即可使用！

#### 1. 安装 Ollama

访问 [Ollama 官网](https://ollama.ai/) 下载并安装 Ollama。

#### 2. 下载模型

```bash
# 下载 Llama 3（推荐用于聊天）
ollama pull llama3:8b

# 下载嵌入模型（用于向量化）
ollama pull nomic-embed-text

# 可选：其他模型
ollama pull qwen3:0.6b    # 轻量快速
ollama pull gemma4:latest  # Google 的模型
```

#### 3. 配置后端

```bash
cd backend

# 复制配置示例
cp .env.example .env

# 编辑 .env 文件，确保以下配置：
# AI_PROVIDER=ollama
# OLLAMA_API_URL=http://localhost:11434
# OLLAMA_CHAT_MODEL=llama3:8b
# OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

#### 4. 启动 Ollama 服务

确保 Ollama 在后台运行（默认端口 11434）。

### 使用 Docker 启动

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 3000 | React 应用 |
| 后端 | 8080 | API 服务 |
| PostgreSQL | 5432 | 数据库 |
| Neo4j | 7474 | 图数据库 Web |
| Neo4j Bolt | 7687 | 图数据库 Bolt |
| Redis | 6379 | 缓存 |
| pgAdmin | 5050 | 数据库管理 |

### 本地开发

```bash
# 后端
cd backend
npm install
npm run dev

# 前端
cd frontend
npm install
npm start
```

## 项目结构

```
.
├── .env                    # 环境变量配置
├── .env.example            # 环境变量配置示例
├── docker-compose.yml       # Docker 配置
├── backend/                # 后端服务
│   ├── server.js           # 入口文件
│   ├── package.json        # 依赖配置
│   ├── config/             # 配置文件
│   │   └── database.js     # 数据库配置
│   ├── models/             # 数据模型
│   ├── routes/             # API 路由
│   │   ├── ai-config.js    # AI 配置 API
│   │   └── deep-analysis.js # 深度分析 API
│   ├── services/           # 业务服务
│   │   ├── ollama.js       # Ollama 本地 AI 服务
│   │   ├── aiServiceManager.js # AI 服务管理器
│   │   └── configManager.js # 配置管理器
│   ├── .env.example        # 后端环境变量示例
│   └── Dockerfile          # 后端 Dockerfile
├── frontend/               # 前端应用
│   ├── package.json        # 依赖配置
│   ├── .env.example        # 前端环境变量示例
│   └── Dockerfile          # 前端 Dockerfile
├── docker/                 # Docker 资源
├── scripts/                # 辅助脚本
└── README.md               # 项目说明
```

## API 接口

### Ollama AI 服务
- `GET /api/ai-config/config` - 获取 AI 配置
- `POST /api/ai-config/models` - 设置 AI 模型配置
- `GET /api/ai-config/ollama/status` - 检查 Ollama 服务状态
- `GET /api/ai-config/ollama/models` - 获取 Ollama 可用模型列表
- `POST /api/ai/chat` - AI 聊天（支持 Ollama）
- `POST /api/ai/analyze` - AI 深度分析（支持 Ollama）

### 深度分析
- `GET /api/deep-analysis/sessions` - 获取分析会话列表
- `POST /api/deep-analysis/sessions` - 创建分析会话
- `POST /api/deep-analysis/sessions/:id/analyze` - 执行深度分析（流式）
- `GET /api/deep-analysis/sessions/:id/history` - 获取会话历史
- `GET /api/cases` - 获取案例列表
- `POST /api/cases` - 创建案例
- `GET /api/cases/:id` - 获取单个案例
- `PUT /api/cases/:id` - 更新案例
- `DELETE /api/cases/:id` - 删除案例

### 验证系统
- `POST /api/verifications` - 创建验证
- `GET /api/verifications` - 获取验证列表

### 模拟系统
- `POST /api/simulations` - 创建模拟
- `GET /api/simulations` - 获取模拟列表

### AI 服务
- `POST /api/ai/deepseek` - DeepSeek 对话
- `POST /api/ai/bailian` - 阿里云百炼对话
- `POST /api/ai/analyze` - 文本分析

### 搜索服务
- `GET /api/search/google` - Google 搜索
- `GET /api/search/serpapi` - SerpAPI 搜索
- `GET /api/search/internal` - 内部搜索

### 认证服务
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

## 环境变量

### 必需变量
```bash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=life_theory_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=LifeTheory@2024

NEO4J_HOST=neo4j
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=LifeTheory@Neo4j2024

DEEPSEEK_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
```

### 可选变量
```bash
ALIBABA_BAILIAN_API_KEY=your_api_key
GOOGLE_API_KEY=your_api_key
GOOGLE_CSE_ID=your_cse_id
SERPAPI_KEY=your_api_key
```

## 数据库初始化

首次启动时，PostgreSQL 会自动执行 `docker/postgres/init.sql` 初始化脚本，创建必要的表结构和示例数据。

## 验证环境配置

```bash
node scripts/validate-env.js
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！