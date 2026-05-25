const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../ai-config.json');

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('加载配置文件失败:', err.message);
    }
    
    return {
      provider: process.env.AI_PROVIDER || 'ollama',
      chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3:8b',
      embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
    };
  }

  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
      console.log('配置已保存:', this.config);
      return true;
    } catch (err) {
      console.error('保存配置文件失败:', err.message);
      return false;
    }
  }

  getProvider() {
    return this.config.provider;
  }

  setProvider(provider) {
    if (['cloud', 'ollama'].includes(provider)) {
      this.config.provider = provider;
      return this.saveConfig();
    }
    return false;
  }

  getChatModel() {
    return this.config.chatModel;
  }

  setChatModel(model) {
    if (model && typeof model === 'string' && model.trim()) {
      this.config.chatModel = model.trim();
      return this.saveConfig();
    }
    return false;
  }

  getEmbeddingModel() {
    return this.config.embeddingModel;
  }

  setEmbeddingModel(model) {
    if (model && typeof model === 'string' && model.trim()) {
      this.config.embeddingModel = model.trim();
      return this.saveConfig();
    }
    return false;
  }

  getAll() {
    return { ...this.config };
  }
}

module.exports = new ConfigManager();