const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

console.log('🔍 开始验证环境变量配置...\n');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env 文件不存在');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

const requiredVars = [
    { name: 'POSTGRES_HOST', desc: 'PostgreSQL 主机' },
    { name: 'POSTGRES_PORT', desc: 'PostgreSQL 端口' },
    { name: 'POSTGRES_DB', desc: 'PostgreSQL 数据库名' },
    { name: 'POSTGRES_USER', desc: 'PostgreSQL 用户名' },
    { name: 'POSTGRES_PASSWORD', desc: 'PostgreSQL 密码' },
    { name: 'NEO4J_HOST', desc: 'Neo4j 主机' },
    { name: 'NEO4J_PORT', desc: 'Neo4j 端口' },
    { name: 'NEO4J_USER', desc: 'Neo4j 用户名' },
    { name: 'NEO4J_PASSWORD', desc: 'Neo4j 密码' },
    { name: 'DEEPSEEK_API_KEY', desc: 'DeepSeek API Key' },
    { name: 'JWT_SECRET', desc: 'JWT 密钥' }
];

const optionalVars = [
    { name: 'ALIBABA_BAILIAN_API_KEY', desc: '阿里云百炼 API Key' },
    { name: 'GOOGLE_API_KEY', desc: 'Google API Key' },
    { name: 'GOOGLE_CSE_ID', desc: 'Google CSE ID' },
    { name: 'SERPAPI_KEY', desc: 'SerpAPI Key' }
];

let allRequiredPresent = true;

console.log('📋 必需环境变量验证:');
console.log('---------------------');

requiredVars.forEach(v => {
    const regex = new RegExp(`^${v.name}=`);
    const found = lines.some(line => regex.test(line) && !line.startsWith('#'));
    
    if (found) {
        console.log(`✅ ${v.name}: ${v.desc}`);
    } else {
        console.log(`❌ ${v.name}: ${v.desc} - 缺失`);
        allRequiredPresent = false;
    }
});

console.log('\n📋 可选环境变量检查:');
console.log('---------------------');

optionalVars.forEach(v => {
    const regex = new RegExp(`^${v.name}=`);
    const found = lines.some(line => regex.test(line) && !line.startsWith('#'));
    
    if (found) {
        console.log(`✅ ${v.name}: ${v.desc} - 已配置`);
    } else {
        console.log(`⚠️ ${v.name}: ${v.desc} - 未配置（可选）`);
    }
});

console.log('\n📋 配置文件结构验证:');
console.log('---------------------');

const requiredFiles = [
    '../docker-compose.yml',
    '../backend/package.json',
    '../backend/server.js',
    '../backend/config/database.js',
    '../backend/models/index.js',
    '../backend/routes/index.js',
    '../backend/Dockerfile',
    '../frontend/Dockerfile',
    '../frontend/package.json',
    '../docker/postgres/init.sql'
];

let allFilesPresent = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 缺失`);
        allFilesPresent = false;
    }
});

console.log('\n=====================');

if (allRequiredPresent && allFilesPresent) {
    console.log('🎉 所有配置验证通过！');
    console.log('\n🚀 启动命令:');
    console.log('  docker-compose up -d');
    console.log('  或分别启动:');
    console.log('    cd backend && npm install && npm run dev');
    console.log('    cd frontend && npm install && npm start');
    process.exit(0);
} else {
    console.log('❌ 配置不完整，请检查缺失项');
    process.exit(1);
}