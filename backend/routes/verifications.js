const express = require('express');
const router = express.Router();
const db = require('../models');

router.post('/', async (req, res) => {
  try {
    const { name, environment_perception, self_regulation, dynamic_balance, 
            information_transfer, continuation, anti_entropy } = req.body;
    
    const average_score = Math.round([
      environment_perception, self_regulation, dynamic_balance,
      information_transfer, continuation, anti_entropy
    ].reduce((a, b) => a + b, 0) / 6);

    let conclusion = '';
    if (average_score >= 80) {
      conclusion = `"${name}" 高度符合生命本质公理，具备完整的自适应能力和延续倾向。`;
    } else if (average_score >= 60) {
      conclusion = `"${name}" 基本符合生命本质公理，但部分特征尚待完善。`;
    } else if (average_score >= 40) {
      conclusion = `"${name}" 处于生命与非生命的边界，需进一步评估。`;
    } else {
      conclusion = `"${name}" 不符合生命本质公理，不具备完整生命特征。`;
    }

    const verification = await db.Verification.create({
      name, environment_perception, self_regulation, dynamic_balance,
      information_transfer, continuation, anti_entropy, average_score, conclusion
    });

    res.status(201).json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const verifications = await db.Verification.findAll();
    res.json(verifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const verification = await db.Verification.findByPk(req.params.id);
    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;