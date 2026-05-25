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
- DeepSeek API 文本分析
- 阿里云百炼 API
- Google 搜索 API
- SerpAPI 联网搜索

## 快速开始

### 环境要求
- Docker >= 20.10
- Docker Compose >= 2.0
- Node.js >= 20.0 (如需本地开发)

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
├── docker-compose.yml       # Docker 配置
├── backend/                # 后端服务
│   ├── server.js           # 入口文件
│   ├── package.json        # 依赖配置
│   ├── config/             # 配置文件
│   │   └── database.js     # 数据库配置
│   ├── models/             # 数据模型
│   │   ├── index.js        # 模型入口
│   │   ├── Case.js         # 案例模型
│   │   ├── User.js         # 用户模型
│   │   ├── Verification.js # 验证模型
│   │   ├── Simulation.js   # 模拟模型
│   │   └── KnowledgeNode.js # 知识节点模型
│   ├── routes/             # API 路由
│   │   ├── index.js        # 路由入口
│   │   ├── cases.js        # 案例 API
│   │   ├── verifications.js # 验证 API
│   │   ├── simulations.js  # 模拟 API
│   │   ├── knowledge.js    # 知识图谱 API
│   │   ├── ai.js           # AI API
│   │   ├── search.js       # 搜索 API
│   │   └── auth.js         # 认证 API
│   └── Dockerfile          # 后端 Dockerfile
├── frontend/               # 前端应用
│   ├── package.json        # 依赖配置
│   └── Dockerfile          # 前端 Dockerfile
├── docker/                 # Docker 资源
│   └── postgres/           # PostgreSQL 初始化
│       └── init.sql        # 初始化脚本
├── scripts/                # 辅助脚本
│   └── validate-env.js     # 环境变量验证
└── README.md               # 项目说明
```

## API 接口

### 案例管理
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