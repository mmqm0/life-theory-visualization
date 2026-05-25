const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    const existing = await db.User.findOne({
      where: { [db.Sequelize.Op.or]: [{ email }, { username }] }
    });
    
    if (existing) {
      return res.status(400).json({ error: '用户已存在' });
    }
    
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const user = await db.User.create({ email, username, password_hash });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ user: { id: user.id, email: user.email, username: user.username }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '认证失败' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '认证失败' });
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    await user.update({ last_login_at: new Date() });
    
    res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  } catch (err) {
    res.status(401).json({ error: 'token无效' });
  }
});

module.exports = router;