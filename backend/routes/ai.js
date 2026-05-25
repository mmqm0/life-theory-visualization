const express = require('express');
const router = express.Router();
const axios = require('axios');
const aiServiceManager = require('../services/aiServiceManager');

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '缺少message参数' });
    }
    
    const currentProvider = aiServiceManager.getProvider();
    console.log(`聊天请求，当前provider: ${currentProvider}`);
    
    const result = await aiServiceManager.chat(message);
    
    if (result.success) {
      res.json({ 
        reply: result.content,
        model: result.model,
        provider: currentProvider
      });
    } else {
      console.error('AI聊天错误:', result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error('AI聊天错误:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/deepseek', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ reply: response.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bailian', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await axios.post(
      process.env.ALIBABA_BAILIAN_API_URL,
      {
        model: 'qwen-turbo',
        input: { messages: [{ role: 'user', content: message }] },
        parameters: { temperature: 0.7 }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ALIBABA_BAILIAN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ reply: response.data.output.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { caseName, description, score } = req.body;
    
    if (!caseName || !description) {
      return res.status(400).json({ error: '缺少必要的案例信息' });
    }

    const caseData = {
      caseName,
      description,
      score
    };

    const result = await aiServiceManager.analyze(caseData);
    
    if (result.success) {
      res.json({ analysis: result.content });
    } else {
      console.error('AI分析错误:', result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error('AI分析错误:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
