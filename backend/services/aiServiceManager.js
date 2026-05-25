const axios = require('axios');
const ollamaService = require('./ollama');
const configManager = require('./configManager');

class AIServiceManager {
  constructor() {
    this.currentProvider = configManager.getProvider();
    this.chatModel = configManager.getChatModel();
    this.embeddingModel = configManager.getEmbeddingModel();
    // 同步到 ollamaService
    ollamaService.chatModel = this.chatModel;
    ollamaService.embeddingModel = this.embeddingModel;
  }

  getProvider() {
    return this.currentProvider;
  }

  setProvider(provider) {
    if (['cloud', 'ollama'].includes(provider)) {
      this.currentProvider = provider;
      return configManager.setProvider(provider);
    }
    return false;
  }

  getModels() {
    return {
      chatModel: this.chatModel,
      embeddingModel: this.embeddingModel
    };
  }

  setChatModel(model) {
    if (model && typeof model === 'string' && model.trim()) {
      this.chatModel = model.trim();
      ollamaService.chatModel = this.chatModel;
      return configManager.setChatModel(model.trim());
    }
    return false;
  }

  setEmbeddingModel(model) {
    if (model && typeof model === 'string' && model.trim()) {
      this.embeddingModel = model.trim();
      ollamaService.embeddingModel = this.embeddingModel;
      return configManager.setEmbeddingModel(model.trim());
    }
    return false;
  }

  async chat(message, options = {}) {
    if (this.currentProvider === 'ollama') {
      return await ollamaService.chat(message, options);
    } else {
      return await this.cloudChat(message, options);
    }
  }

  async chatStream(message, options = {}) {
    if (this.currentProvider === 'ollama') {
      return await ollamaService.chatStream(message, options);
    } else {
      return await this.cloudChatStream(message, options);
    }
  }

  async generateEmbedding(text) {
    if (this.currentProvider === 'ollama') {
      return await ollamaService.generateEmbedding(text);
    } else {
      return await this.cloudGenerateEmbedding(text);
    }
  }

  async cloudChat(message, options = {}) {
    try {
      const response = await axios.post(
        `${process.env.DEEPSEEK_API_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: message }],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: options.stream || false
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        content: response.data.choices[0].message.content,
        model: 'deepseek-chat',
        done: true
      };
    } catch (err) {
      console.error('云端聊天失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async cloudChatStream(message, options = {}) {
    try {
      const response = await axios.post(
        `${process.env.DEEPSEEK_API_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: message }],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
      console.error('云端流式聊天失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async cloudGenerateEmbedding(text) {
    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings',
        {
          model: 'text-embedding-v3',
          input: [text.substring(0, 8000)]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.ALIBABA_BAILIAN_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        embedding: response.data.data[0].embedding,
        model: 'text-embedding-v3'
      };
    } catch (err) {
      console.error('云端向量生成失败:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async analyze(caseData, options = {}) {
    const prompt = this.buildAnalysisPrompt(caseData);
    
    if (this.currentProvider === 'ollama') {
      return await ollamaService.chat(prompt, {
        temperature: 0.7,
        max_tokens: 4000
      });
    } else {
      return await this.cloudChat(prompt, {
        temperature: 0.7,
        max_tokens: 4000
      });
    }
  }

  buildAnalysisPrompt(caseData) {
    return `请基于"生命本质理论"对以下案例进行深度分析。

【生命本质理论核心公理】
主动适配外部环境以求稳定存在，并以一切方式完成自身存在形态的长久延续。
底层驱动力：对抗熵增、维持有序。

【熵变四阶段理论】
1. 熵增启动期（0-49分）：系统开始衰退，需要外部干预
2. 熵衡稳定期（50-74分）：动态平衡，维持相对稳定
3. 熵减升级期（75-89分）：系统优化，能力持续升级
4. 熵恒永续期（90-100分）：高度有序，信息永续传递

【待分析案例】
案例名称：${caseData.caseName}
案例描述：${caseData.description}
${caseData.score !== undefined ? `当前评分：${caseData.score}/100` : ''}

【分析要求】
请进行**全面、深入、详细**的分析，不少于3000字。每个维度都要进行细致探讨：

1. **自适应能力评估**（约600字）：
   - 该案例如何感知并响应环境变化？
   - 其自适应机制的具体表现是什么？
   - 从多个角度分析其适应性的优势和局限性
   - 提供具体的实例或证据支撑

2. **延续倾向分析**（约600字）：
   - 该案例通过什么方式维持自身存在形态？
   - 如何对抗熵增？其延续策略的可持续性如何？
   - 分析其在时间维度上的延续特征
   - 评估其延续能力的强弱和潜在风险

3. **熵变阶段判断**（约500字）：
   - 基于当前状态，判断其处于哪个熵变阶段
   - 详细说明判断的理由和依据
   - 从多个维度（有序度、适应性、延续性）进行论证
   - 分析其向更高阶段演进的可能性

4. **发展建议**（约800字）：
   - 如何帮助其向更高阶的熵变阶段演进？
   - 提供具体、可操作的建议，每个建议都要有详细说明
   - 分析建议实施后的预期效果
   - 制定分阶段的实施路径

5. **本体论视角总结**（约500字）：
   - 从生命本质理论的本体论高度进行总结
   - 提炼核心概念和关键洞察
   - 阐述该案例对理解生命本质的启示

请给出详尽、深入的分析结果，使用丰富的论据和详实的论述。`;
  }

  async deepAnalyze(session, userInput, previousAnalysis, turnNumber) {
    const prompt = this.buildDeepAnalysisPrompt(session, userInput, previousAnalysis, turnNumber);
    
    if (this.currentProvider === 'ollama') {
      return await ollamaService.chat(prompt, {
        temperature: 0.7,
        max_tokens: 6000
      });
    } else {
      return await this.cloudChat(prompt, {
        temperature: 0.7,
        max_tokens: 6000
      });
    }
  }

  buildDeepAnalysisPrompt(session, userInput, previousAnalysis, turnNumber) {
    const basePrompt = `请基于"生命本质理论"进行深度分析。

【生命本质理论核心公理】
主动适配外部环境以求稳定存在，并以一切方式完成自身存在形态的长久延续。
底层驱动力：对抗熵增、维持有序。

【熵变四阶段理论】
1. 熵增启动期（0-49分）：系统开始衰退，需要外部干预
2. 熵衡稳定期（50-74分）：动态平衡，维持相对稳定
3. 熵减升级期（75-89分）：系统优化，能力持续升级
4. 熵恒永续期（90-100分）：高度有序，信息永续传递

【分析案例】
案例名称：${session.case_name}
案例描述：${session.case_description || '无'}
${session.initial_score !== null ? `初始评分：${session.initial_score}/100` : ''}
当前轮次：第${turnNumber}轮`;

    if (turnNumber === 1) {
      return `${basePrompt}

【分析要求】
请进行**全面、深入、详细**的首次深度分析，不少于4000字。每个维度都要进行细致探讨：

1. **本体论定位**（约800字）：
   - 该案例在生命本质理论体系中的本体论位置是什么？
   - 其存在形态的本质特征是什么？
   - 从多个哲学角度进行分析和论证
   - 阐述其与其他存在形态的区别和联系

2. **自适应能力评估**（约800字）：
   - 该案例如何感知并响应环境变化？
   - 其自适应机制的底层逻辑是什么？
   - 从多个层次分析其适应性的表现
   - 提供具体的实例和详细的论证

3. **延续倾向分析**（约800字）：
   - 该案例通过什么方式维持自身存在形态？
   - 如何对抗熵增？其延续策略的可持续性如何？
   - 分析其在时间维度上的延续特征和演化路径
   - 评估其延续能力的强弱和潜在风险

4. **熵变阶段判断**（约600字）：
   - 基于当前状态，判断其处于哪个熵变阶段
   - 从本体论角度详细说明理由和依据
   - 从多个维度（有序度、适应性、延续性）进行论证
   - 分析其向更高阶段演进的可能性和条件

5. **概念提取与分析**（约400字）：
   - 从分析中提取关键本体论概念
   - 详细阐述每个概念的内涵和意义
   - 分析概念之间的内在联系

6. **发展建议**（约600字）：
   - 如何帮助其向更高阶的熵变阶段演进？
   - 提供具体、可操作的建议，每个建议都要有详细说明
   - 分析建议实施后的预期效果
   - 制定分阶段的实施路径

请以结构化格式输出分析结果，并在最后提供以下元数据：
- 熵变阶段：[熵增启动期/熵衡稳定期/熵减升级期/熵恒永续期]
- 自适应评分：[0-100]
- 延续评分：[0-100]
- 关键概念：[概念1, 概念2, 概念3...]`;
    } else {
      return `${basePrompt}

【上一轮分析摘要】
${previousAnalysis ? previousAnalysis.substring(0, 500) + '...' : '无'}

【用户追问】
${userInput}

【分析要求】
请基于上一轮分析，针对用户的追问进行**更深入、更详尽**的探讨，不少于3000字：

1. **深入问题分析**（约1000字）：
   - 结合本体论框架，深入分析用户提出的问题
   - 从多个角度进行论证和阐述
   - 提供详实的论据和实例

2. **判断修正与深化**（约800字）：
   - 如果需要，修正或深化之前的判断
   - 详细说明修正的理由和依据
   - 从新的角度进行论证

3. **针对性发展建议**（约800字）：
   - 提供更具针对性的发展建议
   - 每个建议都要有详细的说明和实施路径
   - 分析预期效果和潜在风险

4. **新概念提取**（约400字）：
   - 提取新的本体论概念
   - 详细阐述概念的内涵和意义

请以结构化格式输出分析结果，并在最后提供以下元数据：
- 熵变阶段：[熵增启动期/熵衡稳定期/熵减升级期/熵恒永续期]
- 自适应评分：[0-100]
- 延续评分：[0-100]
- 关键概念：[概念1, 概念2, 概念3...]`;
    }
  }
}

const aiServiceManager = new AIServiceManager();

module.exports = aiServiceManager;
