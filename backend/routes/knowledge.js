const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/nodes', async (req, res) => {
  try {
    const nodes = await db.KnowledgeNode.findAll();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/nodes', async (req, res) => {
  try {
    const node = await db.KnowledgeNode.create(req.body);
    res.status(201).json(node);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/neo4j/query', async (req, res) => {
  try {
    const { cypher } = req.query;
    const session = db.neo4jDriver.session();
    
    const result = await session.run(cypher);
    const records = result.records.map(record => {
      const obj = {};
      record.keys.forEach(key => {
        obj[key] = record.get(key)?.properties || record.get(key)?.toString() || record.get(key);
      });
      return obj;
    });
    
    await session.close();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/neo4j/create', async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const session = db.neo4jDriver.session();
    
    const result = await session.run(
      'CREATE (n:Concept {name: $name, description: $description, type: $type}) RETURN n',
      { name, description, type }
    );
    
    await session.close();
    res.json({ success: true, node: result.records[0]?.get('n')?.properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/neo4j/connect', async (req, res) => {
  try {
    const { sourceName, targetName, relationType } = req.body;
    const session = db.neo4jDriver.session();
    
    const result = await session.run(
      'MATCH (a:Concept {name: $sourceName}), (b:Concept {name: $targetName}) CREATE (a)-[r:' + relationType.toUpperCase() + ']->(b) RETURN a, b, r',
      { sourceName, targetName }
    );
    
    await session.close();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analysis-graph', async (req, res) => {
  try {
    const session = db.neo4jDriver.session();
    
    const result = await session.run(`
      MATCH (s:AnalysisSession)-[:HAS_RECORD]->(r:AnalysisRecord)-[:EXTRACTED_CONCEPT]->(c:OntologyConcept)
      RETURN s.id as sessionId, s.caseName as caseName, r.id as recordId, r.turnNumber as turnNumber, c.name as conceptName
      ORDER BY s.id, r.turnNumber
    `);
    
    const nodes = [];
    const links = [];
    const conceptSet = new Set();
    
    result.records.forEach(record => {
      const sessionId = record.get('sessionId');
      const caseName = record.get('caseName');
      const recordId = record.get('recordId');
      const turnNumber = record.get('turnNumber');
      const conceptName = record.get('conceptName');
      
      if (!nodes.find(n => n.id === sessionId)) {
        nodes.push({ id: sessionId, name: caseName || '分析会话', type: 'session' });
      }
      
      if (!nodes.find(n => n.id === recordId)) {
        nodes.push({ id: recordId, name: `分析记录 #${turnNumber}`, type: 'record' });
      }
      
      if (!conceptSet.has(conceptName)) {
        nodes.push({ id: conceptName, name: conceptName, type: 'concept' });
        conceptSet.add(conceptName);
      }
      
      links.push({ source: sessionId, target: recordId, relation: 'HAS_RECORD' });
      links.push({ source: recordId, target: conceptName, relation: 'EXTRACTED_CONCEPT' });
    });
    
    await session.close();
    res.json({ nodes, links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;