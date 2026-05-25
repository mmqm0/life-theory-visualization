import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 动态加载vis-network
const loadVisNetwork = () => {
  return new Promise((resolve, reject) => {
    if (window.vis && window.vis.Network && window.vis.DataSet) {
      resolve(window.vis);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js';
    script.onload = () => resolve(window.vis);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function App() {
  const [status, setStatus] = useState({
    backend: 'checking',
    postgres: 'checking',
    neo4j: 'checking',
    redis: 'checking'
  });
  const [aiProvider, setAiProvider] = useState('cloud');
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [aiModels, setAiModels] = useState({ chatModel: '', embeddingModel: '' });
  const [chatModelInput, setChatModelInput] = useState('');
  const [embeddingModelInput, setEmbeddingModelInput] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCase, setSelectedCase] = useState(null);
  const [entropyStage, setEntropyStage] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [knowledgeNodes, setKnowledgeNodes] = useState([]);
  const [knowledgeEdges, setKnowledgeEdges] = useState([]);
  const [kgLoading, setKgLoading] = useState(false);
  const [deepAnalysisSession, setDeepAnalysisSession] = useState(null);
  const [deepAnalysisHistory, setDeepAnalysisHistory] = useState([]);
  const [deepAnalysisInput, setDeepAnalysisInput] = useState('');
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);
  const [selectedCaseForDeepAnalysis, setSelectedCaseForDeepAnalysis] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingMetadata, setStreamingMetadata] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessionList, setShowSessionList] = useState(false);
  const chatHistoryRef = useRef(null);
  const networkRef = useRef(null);
  const networkInstanceRef = useRef(null);

  useEffect(() => {
    checkServices();
    fetchCases();
    fetchKnowledgeGraph();
    fetchAIConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'knowledge' && knowledgeNodes.length > 0 && networkRef.current) {
      initKnowledgeGraph();
    }
  }, [activeTab, knowledgeNodes, knowledgeEdges]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [streamingContent, deepAnalysisHistory]);

  const fetchAIConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-config/config`);
      const data = await response.json();
      setAiProvider(data.currentProvider);
      setAiModels(data.currentModels || { chatModel: '', embeddingModel: '' });
      
      if (data.currentProvider === 'ollama') {
        fetchOllamaStatus();
      }
    } catch (error) {
      console.error('Failed to fetch AI config:', error);
    }
  };

  const fetchOllamaStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-config/ollama/status`);
      const data = await response.json();
      setOllamaStatus(data);
      setAiModels({
        chatModel: data.configuredChatModel || 'llama3.2',
        embeddingModel: data.configuredEmbeddingModel || 'nomic-embed-text'
      });
    } catch (error) {
      console.error('Failed to fetch Ollama status:', error);
      setOllamaStatus({ healthy: false, error: error.message });
    }
  };

  const switchAIProvider = async (provider) => {
    try {
      const response = await fetch(`${API_URL}/ai-config/provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await response.json();
      
      if (response.ok) {
        setAiProvider(provider);
        if (provider === 'ollama') {
          fetchOllamaStatus();
        }
        alert(data.message);
      } else {
        alert('切换失败: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to switch AI provider:', error);
      alert('切换失败: ' + error.message);
    }
  };

  const updateModels = async () => {
    try {
      const updates = {};
      if (chatModelInput.trim()) {
        updates.chatModel = chatModelInput.trim();
      }
      if (embeddingModelInput.trim()) {
        updates.embeddingModel = embeddingModelInput.trim();
      }
      
      if (Object.keys(updates).length === 0) {
        alert('请输入要更新的模型名称');
        return;
      }
      
      const response = await fetch(`${API_URL}/ai-config/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      
      if (response.ok) {
        setAiModels(data.currentModels);
        setChatModelInput('');
        setEmbeddingModelInput('');
        alert('模型配置已更新');
        fetchOllamaStatus();
      } else {
        alert('更新失败: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update models:', error);
      alert('更新失败: ' + error.message);
    }
  };

  const checkServices = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setStatus({
        backend: data.status === 'ok' ? 'healthy' : 'error',
        postgres: 'healthy',
        neo4j: 'healthy',
        redis: 'healthy'
      });
    } catch (error) {
      setStatus({
        backend: 'error',
        postgres: 'error',
        neo4j: 'error',
        redis: 'error'
      });
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch(`${API_URL}/cases`);
      const data = await response.json();
      setCases(data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeGraph = async () => {
    setKgLoading(true);
    try {
      const nodesResponse = await fetch(`${API_URL}/knowledge/nodes`);
      const allNodes = await nodesResponse.json();
      const allEdges = [];
      
      allNodes.forEach(n => {
        if (n.related_nodes && n.related_nodes.length > 0) {
          n.related_nodes.forEach(targetId => {
            if (!allEdges.find(e => e.from === n.id && e.to === targetId)) {
              allEdges.push({
                from: n.id,
                to: targetId,
                label: '关联'
              });
            }
          });
        }
      });
      
      setKnowledgeNodes(allNodes);
      setKnowledgeEdges(allEdges);
    } catch (error) {
      console.error('Failed to fetch knowledge graph:', error);
    } finally {
      setKgLoading(false);
    }
  };

  const initKnowledgeGraph = async () => {
    if (!networkRef.current || knowledgeNodes.length === 0) return;

    try {
      const vis = await loadVisNetwork();
      const { DataSet, Network } = vis;

      const typeColors = {
        axiom: '#ff6b6b',
        concept: '#4ecdc4',
        stage: '#45b7d1',
        mechanism: '#96ceb4',
        conclusion: '#ffeaa7'
      };

      const visNodes = new DataSet(
        knowledgeNodes.map(node => ({
          id: node.id,
          label: node.name,
          title: node.description || '',
          color: {
            background: typeColors[node.type] || '#95a5a6',
            border: '#2c3e50',
            highlight: { background: '#f39c12', border: '#e67e22' }
          },
          font: { size: node.is_center ? 16 : 12 },
          size: node.is_center ? 30 : 20,
          shape: node.is_center ? 'diamond' : 'dot'
        }))
      );

      const visEdges = new DataSet(
        knowledgeEdges.map(edge => ({
          id: `${edge.from}-${edge.to}`,
          from: edge.from,
          to: edge.to,
          label: edge.label,
          arrows: 'to',
          color: { color: '#7f8c8d' },
          font: { size: 10, align: 'middle' },
          smooth: { type: 'curvedCW', roundness: 0.2 }
        }))
      );

      const options = {
        physics: {
          enabled: true,
          stabilization: { iterations: 100 },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.04,
            damping: 0.09
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          dragNodes: true
        }
      };

      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }

      networkInstanceRef.current = new Network(
        networkRef.current,
        { nodes: visNodes, edges: visEdges },
        options
      );
    } catch (error) {
      console.error('Failed to initialize knowledge graph:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getEntropyStageInfo = (score) => {
    if (score >= 90) return { stage: '熵恒永续期', color: '#4caf50', desc: '高度有序，信息永续传递' };
    if (score >= 75) return { stage: '熵减升级期', color: '#2196f3', desc: '系统优化，能力升级' };
    if (score >= 50) return { stage: '熵衡稳定期', color: '#ff9800', desc: '动态平衡，相对稳定' };
    return { stage: '熵增启动期', color: '#f44336', desc: '系统衰退，需要干预' };
  };

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
    setEntropyStage(getEntropyStageInfo(caseItem.score));
  };

  const handleAiAnalyze = async () => {
    if (!selectedCase) return;
    setAiLoading(true);
    try {
      const response = await fetch(`${API_URL}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseName: selectedCase.name,
          description: selectedCase.description,
          score: selectedCase.score
        })
      });
      const data = await response.json();
      setAiAnalysis(data.analysis || '分析完成');
    } catch (error) {
      setAiAnalysis('AI分析暂时不可用，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/deep-analysis/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('获取会话列表失败:', error);
    }
  };

  const startDeepAnalysis = async () => {
    if (!selectedCaseForDeepAnalysis) return;
    setDeepAnalysisLoading(true);
    try {
      const response = await fetch(`${API_URL}/deep-analysis/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCaseForDeepAnalysis.id,
          caseName: selectedCaseForDeepAnalysis.name,
          caseDescription: selectedCaseForDeepAnalysis.description,
          score: selectedCaseForDeepAnalysis.score
        })
      });
      const data = await response.json();
      setDeepAnalysisSession(data.sessionId);
      setDeepAnalysisHistory([]);
      await runDeepAnalysis('请开始第一轮深度分析');
      await fetchSessions();
    } catch (error) {
      console.error('启动深度分析失败:', error);
    } finally {
      setDeepAnalysisLoading(false);
    }
  };

  const continueSession = async (session) => {
    setDeepAnalysisSession(session.id);
    setSelectedCaseForDeepAnalysis({
      id: session.case_id,
      name: session.case_name,
      description: session.case_description,
      score: session.initial_score
    });
    setShowSessionList(false);
    
    try {
      const response = await fetch(`${API_URL}/deep-analysis/sessions/${session.id}/history`);
      const history = await response.json();
      const formattedHistory = history.map(record => ({
        turnNumber: record.turn_number,
        userInput: record.user_input,
        analysis: record.ai_analysis,
        entropyStage: record.entropy_stage,
        scores: {
          selfAdaptation: record.self_adaptation_score,
          continuation: record.continuation_score
        },
        extractedConcepts: record.extracted_concepts
      }));
      setDeepAnalysisHistory(formattedHistory);
    } catch (error) {
      console.error('获取会话历史失败:', error);
    }
  };

  const deleteSession = async (sessionId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('确定要删除这个会话吗？\n此操作将同时删除所有相关的分析记录和向量数据，且无法恢复。')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/deep-analysis/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchSessions();
        
        if (deepAnalysisSession === sessionId) {
          setDeepAnalysisSession(null);
          setDeepAnalysisHistory([]);
          setSelectedCaseForDeepAnalysis(null);
        }
        
        alert('会话已成功删除');
      } else {
        const error = await response.json();
        alert('删除失败: ' + error.message);
      }
    } catch (error) {
      console.error('删除会话失败:', error);
      alert('删除会话时发生错误');
    }
  };

  const runDeepAnalysis = async (userInput) => {
    if (!deepAnalysisSession) return;
    setDeepAnalysisLoading(true);
    setStreamingContent('');
    setStreamingMetadata(null);
    try {
      const lastAnalysis = deepAnalysisHistory.length > 0 
        ? deepAnalysisHistory[deepAnalysisHistory.length - 1].ai_analysis 
        : null;

      const response = await fetch(`${API_URL}/deep-analysis/sessions/${deepAnalysisSession}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          previousAnalysis: lastAnalysis
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setDeepAnalysisHistory(prev => [...prev, data]);
                setStreamingContent('');
                setStreamingMetadata(null);
                setDeepAnalysisInput('');
              } else if (data.type === 'error') {
                console.error('分析错误:', data.error);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('深度分析失败:', error);
    } finally {
      setDeepAnalysisLoading(false);
    }
  };

  const handleDeepAnalysisSubmit = (e) => {
    e.preventDefault();
    if (deepAnalysisInput.trim()) {
      runDeepAnalysis(deepAnalysisInput.trim());
    }
  };

  const tabs = [
    { id: 'overview', label: '总览' },
    { id: 'cases', label: '案例库' },
    { id: 'entropy', label: '熵变模拟' },
    { id: 'deep-analysis', label: '深度分析' },
    { id: 'knowledge', label: '知识图谱' }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>生命本质理论可视化系统</h1>
        <p>基于生命熵变全程推演的完整体系框架</p>
      </header>

      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="container">
        {activeTab === 'overview' && (
          <>
            <section className="card">
              <h2>AI服务配置</h2>
              <div className="ai-provider-selector">
                <div className="provider-option">
                  <input
                    type="radio"
                    id="cloud"
                    name="aiProvider"
                    value="cloud"
                    checked={aiProvider === 'cloud'}
                    onChange={() => switchAIProvider('cloud')}
                  />
                  <label htmlFor="cloud">
                    <strong>云端服务 (DeepSeek + 阿里)</strong>
                    <span className="provider-desc">使用云端AI服务，需要网络连接</span>
                  </label>
                </div>
                <div className="provider-option">
                  <input
                    type="radio"
                    id="ollama"
                    name="aiProvider"
                    value="ollama"
                    checked={aiProvider === 'ollama'}
                    onChange={() => switchAIProvider('ollama')}
                  />
                  <label htmlFor="ollama">
                    <strong>本地Ollama服务</strong>
                    <span className="provider-desc">使用本地Ollama服务，无需网络连接</span>
                  </label>
                </div>
                {aiProvider === 'ollama' && ollamaStatus && (
                  <div className="ollama-status">
                        <div className={`status-indicator ${ollamaStatus.healthy ? 'healthy' : 'error'}`}>
                          {ollamaStatus.healthy ? '✓ Ollama服务正常' : '✗ Ollama服务不可用'}
                        </div>
                        {ollamaStatus.error && (
                          <p className="status-error">错误: {ollamaStatus.error}</p>
                        )}
                        <p className="base-url">地址: {ollamaStatus.baseUrl}</p>
                        
                        {ollamaStatus.healthy && (
                          <div className="model-config-section">
                            <h4>模型配置</h4>
                            <div className="model-config-grid">
                              <div className="model-config-item">
                                <label>聊天模型 (Chat Model):</label>
                                <select 
                                  value={aiModels.chatModel} 
                                  onChange={(e) => {
                                    const newModel = e.target.value;
                                    if (newModel === 'custom') {
                                      setChatModelInput('');
                                    } else {
                                      setAiModels({...aiModels, chatModel: newModel});
                                      fetch(`${API_URL}/ai-config/models`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ chatModel: newModel })
                                      }).then(() => {
                                        alert('聊天模型已更新为: ' + newModel);
                                      }).catch(err => {
                                        console.error('Failed to update chat model:', err);
                                        alert('更新失败');
                                      });
                                    }
                                  }}
                                >
                                  <option value={aiModels.chatModel}>{aiModels.chatModel} (当前)</option>
                                  {ollamaStatus.installedModels && ollamaStatus.installedModels.length > 0 && (
                                    <optgroup label="已安装的模型">
                                      {ollamaStatus.installedModels.map((model, idx) => (
                                        model.name !== aiModels.chatModel && (
                                          <option key={idx} value={model.name}>{model.name}</option>
                                        )
                                      ))}
                                    </optgroup>
                                  )}
                                  <optgroup label="推荐模型">
                                    <option value="llama3.2">llama3.2</option>
                                    <option value="llama3">llama3</option>
                                    <option value="llama2">llama2</option>
                                    <option value="mistral">mistral</option>
                                    <option value="codellama">codellama</option>
                                    <option value="qwen2.5">qwen2.5</option>
                                    <option value="phi3">phi3</option>
                                    <option value="gemma2">gemma2</option>
                                    <option value="deepseek-r1">deepseek-r1</option>
                                  </optgroup>
                                  <option value="custom">+ 输入自定义模型...</option>
                                </select>
                                {(chatModelInput !== '' || aiModels.chatModel === 'custom') && (
                                  <div className="custom-model-input">
                                    <input
                                      type="text"
                                      placeholder="输入自定义模型名称"
                                      value={chatModelInput}
                                      onChange={(e) => setChatModelInput(e.target.value)}
                                      list="chat-model-suggestions"
                                    />
                                    <datalist id="chat-model-suggestions">
                                      {ollamaStatus.installedModels && ollamaStatus.installedModels.map((model, idx) => (
                                        <option key={idx} value={model.name} />
                                      ))}
                                    </datalist>
                                    <button onClick={() => {
                                      if (chatModelInput.trim()) {
                                        setAiModels({...aiModels, chatModel: chatModelInput.trim()});
                                        fetch(`${API_URL}/ai-config/models`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ chatModel: chatModelInput.trim() })
                                        }).then(() => {
                                          alert('聊天模型已更新为: ' + chatModelInput.trim());
                                          setChatModelInput('');
                                        }).catch(err => {
                                          console.error('Failed to update chat model:', err);
                                          alert('更新失败');
                                        });
                                      }
                                    }}>应用</button>
                                  </div>
                                )}
                              </div>
                              <div className="model-config-item">
                                <label>向量化模型 (Embedding Model):</label>
                                <select 
                                  value={aiModels.embeddingModel} 
                                  onChange={(e) => {
                                    const newModel = e.target.value;
                                    if (newModel === 'custom') {
                                      setEmbeddingModelInput('');
                                    } else {
                                      setAiModels({...aiModels, embeddingModel: newModel});
                                      fetch(`${API_URL}/ai-config/models`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ embeddingModel: newModel })
                                      }).then(() => {
                                        alert('向量化模型已更新为: ' + newModel);
                                      }).catch(err => {
                                        console.error('Failed to update embedding model:', err);
                                        alert('更新失败');
                                      });
                                    }
                                  }}
                                >
                                  <option value={aiModels.embeddingModel}>{aiModels.embeddingModel} (当前)</option>
                                  {ollamaStatus.installedModels && ollamaStatus.installedModels.length > 0 && (
                                    <optgroup label="已安装的模型">
                                      {ollamaStatus.installedModels.map((model, idx) => (
                                        model.name !== aiModels.embeddingModel && (
                                          <option key={idx} value={model.name}>{model.name}</option>
                                        )
                                      ))}
                                    </optgroup>
                                  )}
                                  <optgroup label="推荐向量化模型">
                                    <option value="nomic-embed-text">nomic-embed-text</option>
                                    <option value="mxbai-embed-large">mxbai-embed-large</option>
                                    <option value="all-minilm">all-minilm</option>
                                  </optgroup>
                                  <option value="custom">+ 输入自定义模型...</option>
                                </select>
                                {(embeddingModelInput !== '' || aiModels.embeddingModel === 'custom') && (
                                  <div className="custom-model-input">
                                    <input
                                      type="text"
                                      placeholder="输入自定义模型名称"
                                      value={embeddingModelInput}
                                      onChange={(e) => setEmbeddingModelInput(e.target.value)}
                                      list="embedding-model-suggestions"
                                    />
                                    <datalist id="embedding-model-suggestions">
                                      {ollamaStatus.installedModels && ollamaStatus.installedModels.map((model, idx) => (
                                        <option key={idx} value={model.name} />
                                      ))}
                                    </datalist>
                                    <button onClick={() => {
                                      if (embeddingModelInput.trim()) {
                                        setAiModels({...aiModels, embeddingModel: embeddingModelInput.trim()});
                                        fetch(`${API_URL}/ai-config/models`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ embeddingModel: embeddingModelInput.trim() })
                                        }).then(() => {
                                          alert('向量化模型已更新为: ' + embeddingModelInput.trim());
                                          setEmbeddingModelInput('');
                                        }).catch(err => {
                                          console.error('Failed to update embedding model:', err);
                                          alert('更新失败');
                                        });
                                      }
                                    }}>应用</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {ollamaStatus.installedModels && ollamaStatus.installedModels.length > 0 && (
                          <div className="model-list">
                            <h4>已安装的模型:</h4>
                            <ul>
                              {ollamaStatus.installedModels.map((model, idx) => (
                                <li key={idx}>
                                  <strong>{model.name}</strong>
                                  <span className="model-size">{(model.size / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

            <section className="card">
              <h2>系统状态</h2>
              <div className="status-grid">
                <div className="status-item">
                  <span>后端服务</span>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(status.backend) }}></span>
                </div>
                <div className="status-item">
                  <span>PostgreSQL</span>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(status.postgres) }}></span>
                </div>
                <div className="status-item">
                  <span>Neo4j</span>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(status.neo4j) }}></span>
                </div>
                <div className="status-item">
                  <span>Redis</span>
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(status.redis) }}></span>
                </div>
              </div>
            </section>

            <section className="card axiom-card">
              <h2>核心公理</h2>
              <p className="axiom">
                主动适配外部环境以求稳定存在，并以一切方式完成自身存在形态的长久延续
              </p>
              <p className="axiom-sub">底层驱动力：对抗熵增、维持有序</p>
            </section>

            <section className="card">
              <h2>熵变四阶段</h2>
              <div className="entropy-stages">
                <div className="stage-card" style={{ borderLeftColor: '#f44336' }}>
                  <h3>熵增启动期</h3>
                  <p>系统开始衰退，需要外部干预</p>
                  <span className="score-range">0-49分</span>
                </div>
                <div className="stage-card" style={{ borderLeftColor: '#ff9800' }}>
                  <h3>熵衡稳定期</h3>
                  <p>动态平衡，维持相对稳定</p>
                  <span className="score-range">50-74分</span>
                </div>
                <div className="stage-card" style={{ borderLeftColor: '#2196f3' }}>
                  <h3>熵减升级期</h3>
                  <p>系统优化，能力持续升级</p>
                  <span className="score-range">75-89分</span>
                </div>
                <div className="stage-card" style={{ borderLeftColor: '#4caf50' }}>
                  <h3>熵恒永续期</h3>
                  <p>高度有序，信息永续传递</p>
                  <span className="score-range">90-100分</span>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'cases' && (
          <section className="card">
            <h2>案例库</h2>
            {loading ? (
              <p className="loading">加载中...</p>
            ) : cases.length > 0 ? (
              <div className="case-grid">
                {cases.map((caseItem) => {
                  const stage = getEntropyStageInfo(caseItem.score);
                  return (
                    <div
                      key={caseItem.id}
                      className={`case-card ${selectedCase?.id === caseItem.id ? 'selected' : ''}`}
                      onClick={() => handleCaseClick(caseItem)}
                    >
                      <div className="case-header">
                        <h3>{caseItem.name}</h3>
                        <span className="score-badge" style={{ backgroundColor: stage.color }}>
                          {caseItem.score}分
                        </span>
                      </div>
                      <p className="case-desc">{caseItem.description}</p>
                      <div className="case-tags">
                        {caseItem.tags?.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                      <p className="case-conclusion">{caseItem.conclusion}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>暂无案例数据</p>
            )}

            {selectedCase && (
              <div className="case-detail">
                <h3>{selectedCase.name} - 详细分析</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>熵变阶段</label>
                    <span style={{ color: entropyStage?.color }}>{entropyStage?.stage}</span>
                  </div>
                  <div className="detail-item">
                    <label>阶段描述</label>
                    <span>{entropyStage?.desc}</span>
                  </div>
                  <div className="detail-item">
                    <label>类型</label>
                    <span>{selectedCase.type}</span>
                  </div>
                  <div className="detail-item">
                    <label>评分</label>
                    <span>{selectedCase.score}/100</span>
                  </div>
                </div>
                <button className="btn-primary" onClick={handleAiAnalyze} disabled={aiLoading}>
                  {aiLoading ? '分析中...' : 'AI深度分析'}
                </button>
                {aiAnalysis && (
                  <div className="ai-result">
                    <h4>AI分析结果</h4>
                    <p>{aiAnalysis}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'entropy' && (
          <section className="card">
            <h2>熵变动态模拟器</h2>
            <p className="entropy-desc">模拟不同生命形态在熵变四阶段中的演化过程</p>
            <div className="entropy-simulator">
              <div className="sim-controls">
                <label>选择案例：</label>
                <select onChange={(e) => {
                  const caseItem = cases.find(c => c.id === e.target.value);
                  if (caseItem) handleCaseClick(caseItem);
                }}>
                  <option value="">请选择</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedCase && entropyStage && (
                <div className="sim-result">
                  <div className="sim-stage" style={{ backgroundColor: entropyStage.color }}>
                    <h3>{entropyStage.stage}</h3>
                    <p>{entropyStage.desc}</p>
                  </div>
                  <div className="sim-metrics">
                    <div className="metric">
                      <label>有序度</label>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${selectedCase.score}%`, backgroundColor: entropyStage.color }}></div>
                      </div>
                    </div>
                    <div className="metric">
                      <label>适配能力</label>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${selectedCase.score * 0.9}%`, backgroundColor: entropyStage.color }}></div>
                      </div>
                    </div>
                    <div className="metric">
                      <label>延续倾向</label>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${selectedCase.score * 0.95}%`, backgroundColor: entropyStage.color }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'deep-analysis' && (
          <section className="card">
            <h2>多轮AI深度分析</h2>
            <p className="deep-analysis-desc">基于生命本质理论进行多轮深入分析，结果将存储至图数据库并向量化入库</p>
            
            <div className="deep-analysis-setup">
              <label>选择分析案例：</label>
              <select 
                onChange={(e) => {
                  const caseItem = cases.find(c => c.id === e.target.value);
                  setSelectedCaseForDeepAnalysis(caseItem);
                  setDeepAnalysisSession(null);
                  setDeepAnalysisHistory([]);
                }}
                value={selectedCaseForDeepAnalysis?.id || ''}
              >
                <option value="">请选择案例</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button 
                className="btn-primary" 
                onClick={startDeepAnalysis} 
                disabled={!selectedCaseForDeepAnalysis || deepAnalysisLoading}
              >
                {deepAnalysisLoading && !deepAnalysisSession ? '启动中...' : '开始深度分析'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowSessionList(!showSessionList);
                  if (!showSessionList) {
                    fetchSessions();
                  }
                }}
              >
                {showSessionList ? '隐藏历史会话' : '查看历史会话'}
              </button>
            </div>

            {showSessionList && sessions.length > 0 && (
              <div className="session-list">
                <h3>历史会话列表</h3>
                <div className="session-items">
                  {sessions.map(session => (
                    <div key={session.id} className="session-item" onClick={() => continueSession(session)}>
                      <div className="session-content">
                        <div className="session-name">{session.case_name}</div>
                        <div className="session-meta">
                          <span>对话轮数：{session.turn_count}</span>
                          <span>{new Date(session.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <button 
                        className="btn-delete" 
                        onClick={(e) => deleteSession(session.id, e)}
                        title="删除会话"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deepAnalysisSession && (
              <div className="deep-analysis-chat">
                <div ref={chatHistoryRef} className="chat-history">
                  {deepAnalysisHistory.map((record, idx) => (
                    <div key={idx} className="chat-turn">
                      {record.userInput && (
                        <div className="chat-message user">
                          <div className="message-header">用户提问（第{record.turnNumber}轮）</div>
                          <div className="message-content">{record.userInput}</div>
                        </div>
                      )}
                      <div className="chat-message ai">
                        <div className="message-header">AI深度分析</div>
                        <div className="message-content">{record.analysis}</div>
                        {record.entropyStage && (
                          <div className="message-meta">
                            <span className="meta-tag stage">熵变阶段：{record.entropyStage}</span>
                            {record.scores?.selfAdaptation && (
                              <span className="meta-tag score">自适应：{record.scores.selfAdaptation}</span>
                            )}
                            {record.scores?.continuation && (
                              <span className="meta-tag score">延续性：{record.scores.continuation}</span>
                            )}
                          </div>
                        )}
                        {record.extractedConcepts && record.extractedConcepts.length > 0 && (
                          <div className="message-concepts">
                            <label>提取概念：</label>
                            {record.extractedConcepts.map((concept, cIdx) => (
                              <span key={cIdx} className="concept-tag">{concept}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {streamingContent && (
                    <div className="chat-turn">
                      <div className="chat-message ai streaming">
                        <div className="message-header">AI深度分析（流式输出中...）</div>
                        <div className="message-content">{streamingContent}</div>
                      </div>
                    </div>
                  )}
                  {deepAnalysisLoading && !streamingContent && (
                    <div className="chat-message ai loading">
                      <div className="message-header">AI分析中...</div>
                    </div>
                  )}
                </div>
                <form className="chat-input-form" onSubmit={handleDeepAnalysisSubmit}>
                  <input
                    type="text"
                    value={deepAnalysisInput}
                    onChange={(e) => setDeepAnalysisInput(e.target.value)}
                    placeholder="输入追问，继续深入分析..."
                    disabled={deepAnalysisLoading}
                  />
                  <button type="submit" disabled={deepAnalysisLoading || !deepAnalysisInput.trim()}>
                    发送
                  </button>
                </form>
              </div>
            )}
          </section>
        )}

        {activeTab === 'knowledge' && (
          <section className="card">
            <h2>知识图谱</h2>
            <p className="kg-desc">生命本质理论的核心概念及其关系网络（与Neo4j数据库动态交互）</p>
            {kgLoading ? (
              <p className="loading">加载知识图谱...</p>
            ) : knowledgeNodes.length > 0 ? (
              <div className="knowledge-graph-container">
                <div ref={networkRef} className="knowledge-graph-network"></div>
                <div className="kg-legend">
                  <h4>图例</h4>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></span>
                    <span>公理</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#4ecdc4' }}></span>
                    <span>概念</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#45b7d1' }}></span>
                    <span>阶段</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#96ceb4' }}></span>
                    <span>机制</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ffeaa7' }}></span>
                    <span>结论</span>
                  </div>
                </div>
              </div>
            ) : (
              <p>暂无知识图谱数据</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
