const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.chatModel = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return { healthy: true, models: response.data.models };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }

  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (err) {
      console.error('获取Ollama模型列表失败:', err.message);
      return [];
    }
  }

  async chat(message, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: options.model || this.chatModel,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            num_predict: options.max_tokens || 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      return new Promise((resolve, reject) => {
        let fullContent = '';
        let lastModel = '';
        let done = false;
        
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message && data.message.content) {
                fullContent += data.message.content;
              }
              if (data.model) {
                lastModel = data.model;
              }
              if (data.done === true) {
                done = true;
              }
            } catch (e) {
              // ignore parse errors for incomplete lines
            }
          }
        });

        response.data.on('end', () => {
          resolve({
            success: true,
            content: fullContent,
            model: lastModel,
            done: done
          });
        });

        response.data.on('error', (err) => {
          console.error('Ollama聊天流错误:', err.message);
          reject({
            success: false,
            error: err.message
          });
        });
      });
    } catch (err) {
      console.error('Ollama聊天失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async chatStream(message, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: options.model || this.chatModel,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          stream: true,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            num_predict: options.max_tokens || 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      return {
        success: true,
        stream: response.data
      };
    } catch (err) {
      console.error('Ollama流式聊天失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async generateEmbedding(text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/embeddings`,
        {
          model: this.embeddingModel,
          prompt: text.substring(0, 8000)
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        embedding: response.data.embedding,
        model: response.data.model
      };
    } catch (err) {
      console.error('Ollama生成向量失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async generateCompletion(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: options.model || this.chatModel,
          prompt: prompt,
          stream: options.stream || false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            num_predict: options.max_tokens || 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        content: response.data.response,
        model: response.data.model,
        done: response.data.done
      };
    } catch (err) {
      console.error('Ollama生成失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

const ollamaService = new OllamaService();

module.exports = ollamaService;
