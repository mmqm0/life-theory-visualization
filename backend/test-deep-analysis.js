const axios = require('axios');

async function testDeepAnalysis() {
  try {
    console.log('测试深度分析功能...');
    
    // 先创建一个会话
    const sessionResponse = await axios.post(
      'http://localhost:8080/api/deep-analysis/sessions',
      {
        caseName: '测试案例',
        caseDescription: '这是一个测试案例',
        score: 80
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const sessionId = sessionResponse.data.sessionId;
    console.log('创建会话成功，sessionId:', sessionId);
    
    // 开始深度分析
    console.log('开始深度分析...');
    
    const response = await axios.post(
      `http://localhost:8080/api/deep-analysis/sessions/${sessionId}/analyze`,
      {
        userInput: '请开始第一轮深度分析',
        previousAnalysis: null
      },
      { 
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream'
      }
    );
    
    return new Promise((resolve, reject) => {
      let fullContent = '';
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6).trim();
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'chunk') {
                fullContent += parsed.content;
                process.stdout.write('.');
              } else if (parsed.type === 'complete') {
                console.log('\n\n深度分析完成！');
                console.log('总长度:', fullContent.length);
                console.log('分析结果预览:', fullContent.substring(0, 200) + '...');
                resolve(fullContent);
              } else if (parsed.type === 'error') {
                console.error('\n错误:', parsed.error);
                reject(new Error(parsed.error));
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      });
      
      response.data.on('error', (err) => {
        console.error('\n流错误:', err.message);
        reject(err);
      });
    });
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

testDeepAnalysis().then(() => {
  console.log('\n✅ 测试成功！');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ 测试失败！');
  process.exit(1);
});
