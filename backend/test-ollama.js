const axios = require('axios');

async function testChat() {
  try {
    console.log('测试Ollama聊天功能...');
    
    const response = await axios.post(
      'http://localhost:8080/api/ai/chat',
      { message: '你好，我想了解生命本质理论' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('成功！');
    console.log('响应:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('错误:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testChat();