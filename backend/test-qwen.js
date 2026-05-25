const axios = require('axios');
const API_URL = 'http://localhost:8080/api';

async function testQwenModel() {
  console.log('=== 测试 qwen3.5:4b 模型 ===\n');
  
  try {
    // 1. 先更新模型为 qwen3.5:4b
    console.log('1. 更新模型为 qwen3.5:4b...');
    const updateRes = await axios.post(
      `${API_URL}/ai-config/models`,
      { chatModel: 'qwen3.5:4b' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('更新响应:', JSON.stringify(updateRes.data, null, 2));
    
    // 2. 验证配置
    console.log('\n2. 验证配置...');
    const configRes = await axios.get(`${API_URL}/ai-config/config`);
    console.log('当前配置:', JSON.stringify(configRes.data.currentModels, null, 2));
    
    // 3. 检查 ai-config.json
    console.log('\n3. 检查配置文件...');
    const fs = require('fs');
    const configContent = fs.readFileSync('e:/rjkf/260516-T/backend/ai-config.json', 'utf8');
    console.log('ai-config.json 内容:', configContent);
    
    // 4. 测试对话
    console.log('\n4. 测试对话（可能需要一些时间）...');
    const startTime = Date.now();
    
    try {
      const chatRes = await axios.post(
        `${API_URL}/ai/chat`,
        { message: '你好' },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      const duration = Date.now() - startTime;
      
      console.log('对话响应 (耗时', duration, 'ms):');
      console.log(JSON.stringify(chatRes.data, null, 2));
    } catch (chatError) {
      const duration = Date.now() - startTime;
      console.error('对话失败 (耗时', duration, 'ms):', chatError.message);
      if (chatError.response) {
        console.error('响应状态:', chatError.response.status);
        console.error('响应数据:', chatError.response.data);
      }
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

testQwenModel();