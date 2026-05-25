const express = require('express');
const router = express.Router();
const db = require('../models');

router.post('/', async (req, res) => {
  try {
    const { name, negative_entropy_rate, positive_entropy_rate, pressure, resources } = req.body;
    
    const net_entropy = positive_entropy_rate - negative_entropy_rate + (pressure * 0.3) - (resources * 0.2);
    const final_entropy = Math.max(0, Math.min(100, 50 + net_entropy));
    
    let status = 'stable';
    if (final_entropy > 75) status = 'critical';
    else if (final_entropy > 40) status = 'stable';
    else if (final_entropy > 20) status = 'evolving';
    else status = 'eternal';

    const entropy_history = Array.from({ length: 20 }, () => 
      Math.max(0, Math.min(100, 50 + (Math.random() - 0.5) * 30))
    );

    const simulation = await db.Simulation.create({
      name, negative_entropy_rate, positive_entropy_rate, pressure, resources,
      final_entropy, status, entropy_history
    });

    res.status(201).json(simulation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const simulations = await db.Simulation.findAll();
    res.json(simulations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const simulation = await db.Simulation.findByPk(req.params.id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    res.json(simulation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;