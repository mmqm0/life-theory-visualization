const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const aiServiceManager = require('../services/aiServiceManager');

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await db.AnalysisSession.findAll({
      order: [['created_at', 'DESC']],
      attributes: ['id', 'case_name', 'case_description', 'initial_score', 'turn_count', 'status', 'created_at']
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await db.AnalysisSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }
    
    const records = await db.AnalysisRecord.findAll({
      where: { session_id: sessionId }
    });
    
    const recordIds = records.map(r => r.id);
    
    if (recordIds.length > 0) {
      await db.AnalysisVector.destroy({
        where: { record_id: recordIds }
      });
      
      await db.AnalysisRecord.destroy({
        where: { session_id: sessionId }
      });
    }
    
    const neo4jSession = db.neo4jDriver.session();
    try {
      await neo4jSession.run(
        'MATCH (s:AnalysisSession {id: $sessionId}) DETACH DELETE s',
        { sessionId }
      );
    } finally {
      await neo4jSession.close();
    }
    
    await session.destroy();
    
    res.json({ success: true, message: '会话已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const { caseId, caseName, caseDescription, score } = req.body;
    
    const session = await db.AnalysisSession.create({
      case_id: caseId,
      case_name: caseName,
      case_description: caseDescription,
      initial_score: score,
      status: 'active',
      turn_count: 0
    });
    
    res.status(201).json({ sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/:sessionId/analyze', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userInput, previousAnalysis } = req.body;
    
    console.log('开始流式分析，sessionId:', sessionId);
    
    const session = await db.AnalysisSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: '分析会话不存在' });
    }
    
    const turnNumber = session.turn_count + 1;
    
    const prompt = buildDeepAnalysisPrompt(session, userInput, previousAnalysis, turnNumber);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    let fullResponse = '';
    let chunkCount = 0;
    let buffer = '';
    
    const currentProvider = aiServiceManager.getProvider();
    console.log(`使用AI服务提供商: ${currentProvider === 'cloud' ? '云端服务' : '本地Ollama服务'}`);
    
    let response;
    if (currentProvider === 'ollama') {
      response = await aiServiceManager.chatStream(prompt, {
        temperature: 0.7,
        max_tokens: 2000
      });
      
      if (!response.success) {
        console.error('Ollama流式聊天失败:', response.error);
        return res.status(500).json({ error: response.error });
      }
      
      console.log('Ollama API响应开始...');
      
      response.stream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Ollama 流式响应格式：每行一个JSON对象
          if (trimmedLine.startsWith('{')) {
            const data = trimmedLine;
            if (data === '[DONE]') {
              console.log('收到[DONE]信号');
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.message?.content;
              if (content) {
                fullResponse += content;
                chunkCount++;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
                if (res.flush) {
                  res.flush();
                }
                if (chunkCount % 10 === 0) {
                  console.log(`已发送${chunkCount}个chunk，当前长度: ${fullResponse.length}`);
                }
              }
            } catch (e) {
              console.log('解析chunk失败:', e.message, '数据:', trimmedLine);
            }
          }
        }
      });
      
      response.stream.on('end', () => {
        processAnalysisComplete(res, sessionId, turnNumber, userInput, session, fullResponse, chunkCount, buffer);
      });
      
      response.stream.on('error', (err) => {
        console.error('流式响应错误:', err.message);
        if (!res.headersSent) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
          res.end();
        }
      });
    } else {
      response = await axios.post(
        `${process.env.DEEPSEEK_API_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 6000,
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
      
      console.log('DeepSeek API响应开始...');
      
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine;
            if (data === '[DONE]') {
              console.log('收到[DONE]信号');
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                chunkCount++;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
                if (res.flush) {
                  res.flush();
                }
                if (chunkCount % 10 === 0) {
                  console.log(`已发送${chunkCount}个chunk，当前长度: ${fullResponse.length}`);
                }
              }
            } catch (e) {
              console.log('解析chunk失败:', e.message, '数据:', trimmedLine);
            }
          }
        }
      });
      
      response.data.on('end', () => {
        processAnalysisComplete(res, sessionId, turnNumber, userInput, session, fullResponse, chunkCount, buffer);
      });
      
      response.data.on('error', (err) => {
        console.error('流式响应错误:', err.message);
        if (!res.headersSent) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
          res.end();
        }
      });
    }
    
    req.on('close', () => {
      console.log('客户端断开连接');
      if (response.stream && response.stream.destroy) {
        response.stream.destroy();
      } else if (response.data && response.data.destroy) {
        response.data.destroy();
      }
    });
  } catch (err) {
    console.error('深度分析错误:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

async function processAnalysisComplete(res, sessionId, turnNumber, userInput, session, fullResponse, chunkCount, buffer) {
  try {
    console.log('流结束，总chunk数:', chunkCount, '总长度:', fullResponse.length);
    
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine;
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.message?.content || parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
            }
          } catch (e) {
          }
        }
      }
    }
    
    const extractedConcepts = extractOntologyConcepts(fullResponse);
    const entropyStage = extractEntropyStage(fullResponse);
    const scores = extractScores(fullResponse);
    
    const record = await db.AnalysisRecord.create({
      session_id: sessionId,
      turn_number: turnNumber,
      user_input: userInput,
      ai_analysis: fullResponse,
      entropy_stage: entropyStage,
      self_adaptation_score: scores.selfAdaptation,
      continuation_score: scores.continuation,
      extracted_concepts: extractedConcepts
    });
    
    await storeInNeo4j(session, record, extractedConcepts);
    
    const conceptNodeIds = [];
    const typeMapping = {
      '自适应': { type: 'concept', baseNode: '环境自适应', description: '通过感知环境变量，自主调整自身结构、代谢、行为或逻辑，抵消环境波动带来的熵增冲击。' },
      '环境适配': { type: 'concept', baseNode: '环境自适应', description: '通过感知环境变量，自主调整自身结构、代谢、行为或逻辑，抵消环境波动带来的熵增冲击。' },
      '延续': { type: 'concept', baseNode: '存在延续', description: '通过物质更替，信息传递、形态迭代，突破个体熵增溃散的局限，让自身有序结构持续留存。' },
      '熵增': { type: 'stage', baseNode: '熵增启动期', description: '环境高熵无序，偶然物质聚合，出现初步有序结构，熵增速率高于负熵摄入速率。' },
      '熵减': { type: 'stage', baseNode: '熵减升级期', description: '负熵摄入超过熵增，生命有序度持续提升，意识在此阶段诞生。' },
      '熵衡': { type: 'stage', baseNode: '熵衡稳定期', description: '负熵摄入与熵增趋于平衡，生命维持稳定低熵状态，自我边界清晰。' },
      '熵恒': { type: 'stage', baseNode: '熵恒永续期', description: '个体熵增不可避免，但种群、文明的熵变趋于恒定低熵，实现有序结构永续。' },
      '对抗熵增': { type: 'concept', baseNode: '熵变驱动', description: '生命熵变全程围绕熵增-负熵-熵减的动态循环展开，贯穿生命从诞生到延续的全流程。' },
      '有序': { type: 'concept', baseNode: '熵变驱动', description: '生命熵变全程围绕熵增-负熵-熵减的动态循环展开，贯穿生命从诞生到延续的全流程。' },
      '无序': { type: 'concept', baseNode: '熵变驱动', description: '生命熵变全程围绕熵增-负熵-熵减的动态循环展开，贯穿生命从诞生到延续的全流程。' },
      '存在形态': { type: 'mechanism', baseNode: '非碳基生命', description: '换一种载体，遵循同一熵变逻辑，实现自适应与延续。' },
      '信息传递': { type: 'mechanism', baseNode: '意识演化', description: '意识是熵减升级期的高阶产物，成为高阶自适应工具。' },
      '维持有序': { type: 'concept', baseNode: '环境自适应', description: '通过感知环境变量，自主调整自身结构、代谢、行为或逻辑，抵消环境波动带来的熵增冲击。' },
      '底层驱动力': { type: 'axiom', baseNode: '生命本质公理', description: '生命的唯一底层本质：主动适配外部环境以求稳定存在，并以一切方式完成自身存在形态的长久延续。' }
    };
    
    for (const conceptName of extractedConcepts) {
      if (!conceptName || typeof conceptName !== 'string' || conceptName.trim() === '') {
        continue;
      }
      
      const trimmedConcept = conceptName.trim();
      let conceptNode = await db.KnowledgeNode.findOne({ where: { name: trimmedConcept } });
      
      if (!conceptNode) {
        const mapping = typeMapping[trimmedConcept] || { type: 'concept', baseNode: '熵变驱动', description: '从AI深度分析中提取的本体论概念' };
        let baseNode = null;
        if (mapping.baseNode) {
          baseNode = await db.KnowledgeNode.findOne({ where: { name: mapping.baseNode } });
        }
        
        conceptNode = await db.KnowledgeNode.create({
          name: trimmedConcept,
          description: mapping.description,
          type: mapping.type,
          is_center: false,
          position_x: Math.random() * 60 + 20,
          position_y: Math.random() * 60 + 20,
          related_nodes: baseNode ? [baseNode.id] : []
        });
      }
      
      conceptNodeIds.push(conceptNode.id);
    }
    
    setImmediate(async () => {
      try {
        await vectorizeAndStore(record, fullResponse, 'ai_analysis');
        if (userInput) {
          await vectorizeAndStore(record, userInput, 'user_input');
        }
      } catch (err) {
        console.error('向量化存储失败:', err.message);
      }
    });
    
    await session.update({ turn_count: turnNumber });
    
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      recordId: record.id,
      turnNumber,
      analysis: fullResponse,
      entropyStage,
      scores,
      extractedConcepts
    })}\n\n`);
    
    res.end();
    console.log('流式响应完成');
  } catch (err) {
    console.error('处理完成数据错误:', err.message);
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
}

router.get('/sessions/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await db.AnalysisRecord.findAll({
      where: { session_id: sessionId },
      order: [['turn_number', 'ASC']]
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/search/similar', async (req, res) => {
  try {
    const { text, limit = 5 } = req.body;
    
    const embedding = await generateEmbedding(text);
    
    if (!embedding) {
      return res.json([]);
    }
    
    const embeddingStr = '[' + embedding.join(',') + ']';
    
    const results = await db.sequelize.query(`
      SELECT 
        av.id,
        av.content,
        av.content_type,
        av.metadata,
        av.embedding <=> $1::vector(1024) AS similarity,
        ar.turn_number,
        ar.entropy_stage,
        asess.case_name
      FROM analysis_vectors av
      JOIN analysis_records ar ON av.record_id = ar.id
      JOIN analysis_sessions asess ON ar.session_id = asess.id
      WHERE av.embedding IS NOT NULL
      ORDER BY av.embedding <=> $1::vector(1024)
      LIMIT $2
    `, {
      bind: [embeddingStr, limit],
      type: db.Sequelize.QueryTypes.SELECT
    });
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildDeepAnalysisPrompt(session, userInput, previousAnalysis, turnNumber) {
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

async function callDeepSeekAPI(prompt) {
  const response = await axios.post(
    `${process.env.DEEPSEEK_API_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 6000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content;
}

function extractOntologyConcepts(text) {
  const conceptPattern = /关键概念[：:]\s*\[([^\]]+)\]/;
  const match = text.match(conceptPattern);
  if (match) {
    return match[1].split(/[,，]/).map(c => c.trim()).filter(c => c && typeof c === 'string');
  }
  
  const defaultConcepts = ['自适应', '延续', '熵变'];
  const ontologyTerms = ['自适应', '延续', '熵增', '熵减', '熵衡', '熵恒', '有序', '无序', '信息传递', '环境适配', '存在形态', '底层驱动力', '对抗熵增', '维持有序'];
  const found = ontologyTerms.filter(term => text.includes(term));
  return found.length > 0 ? found : defaultConcepts;
}

function extractEntropyStage(text) {
  const stagePattern = /熵变阶段[：:]\s*\[?([^\]\n]+)\]?/;
  const match = text.match(stagePattern);
  if (match) {
    const stage = match[1].trim();
    if (stage.includes('熵增')) return '熵增启动期';
    if (stage.includes('熵衡')) return '熵衡稳定期';
    if (stage.includes('熵减')) return '熵减升级期';
    if (stage.includes('熵恒')) return '熵恒永续期';
  }
  return null;
}

function extractScores(text) {
  const selfAdaptPattern = /自适应评分[：:]\s*\[?(\d+)\]?/;
  const continuationPattern = /延续评分[：:]\s*\[?(\d+)\]?/;
  
  const selfAdaptMatch = text.match(selfAdaptPattern);
  const continuationMatch = text.match(continuationPattern);
  
  return {
    selfAdaptation: selfAdaptMatch ? parseInt(selfAdaptMatch[1]) : null,
    continuation: continuationMatch ? parseInt(continuationMatch[1]) : null
  };
}

async function storeInNeo4j(session, record, concepts) {
  const sessionNeo = db.neo4jDriver.session();
  try {
    const validConcepts = (concepts || []).filter(c => c && typeof c === 'string' && c.trim());
    
    await sessionNeo.run(`
      MERGE (s:AnalysisSession {id: $sessionId})
      SET s.caseName = $caseName, s.turnCount = $turnCount, s.updatedAt = timestamp()
      
      MERGE (r:AnalysisRecord {id: $recordId})
      SET r.turnNumber = $turnNumber, r.entropyStage = $entropyStage, r.createdAt = timestamp()
      MERGE (s)-[:HAS_RECORD]->(r)
    `, {
      sessionId: session.id,
      caseName: session.case_name,
      turnCount: record.turn_number,
      recordId: record.id,
      turnNumber: record.turn_number,
      entropyStage: record.entropy_stage
    });
    
    if (validConcepts.length > 0) {
      await sessionNeo.run(`
        UNWIND $concepts AS conceptName
        MERGE (c:OntologyConcept {name: conceptName})
        WITH c
        MATCH (r:AnalysisRecord {id: $recordId})
        MERGE (r)-[:EXTRACTED_CONCEPT]->(c)
      `, {
        concepts: validConcepts,
        recordId: record.id
      });
    }
  } finally {
    await sessionNeo.close();
  }
}

async function generateEmbedding(text) {
  const result = await aiServiceManager.generateEmbedding(text);
  
  if (result.success) {
    return result.embedding;
  }
  
  console.error('生成向量失败:', result.error);
  return null;
}

async function vectorizeAndStore(record, content, contentType) {
  const embedding = await generateEmbedding(content);
  
  if (!embedding) {
    console.log('向量生成失败，跳过存储');
    return;
  }
  
  const embeddingStr = '[' + embedding.join(',') + ']';
  
  const sql = `
    INSERT INTO analysis_vectors (id, record_id, content, embedding, content_type, metadata)
    VALUES (uuid_generate_v4(), $1, $2, $3::vector(1024), $4, $5)
  `;
  
  await db.sequelize.query(sql, {
    bind: [
      record.id,
      content.substring(0, 500),
      embeddingStr,
      contentType,
      JSON.stringify({
        session_id: record.session_id,
        turn_number: record.turn_number,
        full_content: content
      })
    ]
  });
  
  console.log('向量存储成功，record_id:', record.id);
}

module.exports = router;

