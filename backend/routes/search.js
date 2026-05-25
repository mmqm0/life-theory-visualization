const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/google', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: query
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/serpapi', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: process.env.SERPAPI_KEY,
        q: query,
        engine: 'google'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/internal', async (req, res) => {
  try {
    const { query } = req.query;
    const db = require('../models');
    
    const cases = await db.Case.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { name: { [db.Sequelize.Op.iLike]: `%${query}%` } },
          { description: { [db.Sequelize.Op.iLike]: `%${query}%` } }
        ]
      }
    });
    
    const nodes = await db.KnowledgeNode.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { name: { [db.Sequelize.Op.iLike]: `%${query}%` } },
          { description: { [db.Sequelize.Op.iLike]: `%${query}%` } }
        ]
      }
    });
    
    res.json({ cases, nodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;