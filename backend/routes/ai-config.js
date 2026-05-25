const express = require('express');
const router = express.Router();
const aiServiceManager = require('../services/aiServiceManager');
const ollamaService = require('../services/ollama');

router.get('/config', (req, res) => {
  const currentProvider = aiServiceManager.getProvider();
  const currentModels = aiServiceManager.getModels();
  
  res.json({
    currentProvider,
    currentModels,
    availableProviders: [
      {
        id: 'cloud',
        name: '云端服务 (DeepSeek + 阿里)',
        description: '使用云端AI服务，需要网络连接',
        features: {
          chat: true,
          deepAnalysis: true,
          embedding: true
        }
      },
      {
        id: 'ollama',
        name: '本地Ollama服务',
        description: '使用本地Ollama服务，无需网络连接',
        features: {
          chat: true,
          deepAnalysis: true,
          embedding: true
        }
      }
    ],
    configuration: {
      cloud: {
        deepseekUrl: process.env.DEEPSEEK_API_URL,
        bailianUrl: process.env.ALIBABA_BAILIAN_API_URL
      },
      ollama: {
        baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
        availableChatModels: ['llama3.2', 'llama3', 'llama2', 'mistral', 'codellama', 'qwen2.5', 'phi3', 'gemma2'],
        availableEmbeddingModels: ['nomic-embed-text', 'mxbai-embed-large', 'all-minilm']
      }
    }
  });
});

router.post('/provider', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ error: '缺少provider参数' });
    }
    
    if (!['cloud', 'ollama'].includes(provider)) {
      return res.status(400).json({ 
        error: '无效的provider类型',
        validProviders: ['cloud', 'ollama']
      });
    }
    
    if (provider === 'ollama') {
      const health = await ollamaService.checkHealth();
      if (!health.healthy) {
        return res.status(503).json({ 
          error: 'Ollama服务不可用',
          details: health.error,
          message: '请确保Ollama服务正在运行'
        });
      }
    }
    
    aiServiceManager.setProvider(provider);
    
    res.json({
      success: true,
      message: `AI服务提供商已切换到: ${provider === 'cloud' ? '云端服务' : '本地Ollama服务'}`,
      currentProvider: provider
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/models', async (req, res) => {
  try {
    const { chatModel, embeddingModel } = req.body;
    
    if (!chatModel && !embeddingModel) {
      return res.status(400).json({ error: '至少需要提供chatModel或embeddingModel之一' });
    }
    
    if (chatModel) {
      aiServiceManager.setChatModel(chatModel);
    }
    
    if (embeddingModel) {
      aiServiceManager.setEmbeddingModel(embeddingModel);
    }
    
    res.json({
      success: true,
      message: '模型配置已更新',
      currentModels: aiServiceManager.getModels()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ollama/status', async (req, res) => {
  try {
    const health = await ollamaService.checkHealth();
    const models = await ollamaService.listModels();
    
    res.json({
      healthy: health.healthy,
      error: health.error,
      baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      configuredChatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
      configuredEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
      installedModels: models.map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at
      })),
      availableChatModels: ['llama3.2', 'llama3', 'llama2', 'mistral', 'codellama', 'qwen2.5', 'phi3', 'gemma2', 'deepseek-r1'],
      availableEmbeddingModels: ['nomic-embed-text', 'mxbai-embed-large', 'all-minilm']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ollama/pull-model', async (req, res) => {
  try {
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: '缺少model参数' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const response = await fetch(`${process.env.OLLAMA_API_URL || 'http://localhost:11434'}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: model }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      return res.status(500).json({ error: '拉取模型失败' });
    }
    
    response.body.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          if (res.flush) res.flush();
        } catch (e) {
          // ignore parse errors
        }
      }
    });
    
    response.body.on('end', () => {
      res.write(`data: ${JSON.stringify({ status: 'complete' })}\n\n`);
      res.end();
    });
    
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
