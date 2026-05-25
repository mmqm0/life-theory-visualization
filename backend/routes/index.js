const express = require('express');
const router = express.Router();

router.use('/cases', require('./cases'));
router.use('/verifications', require('./verifications'));
router.use('/simulations', require('./simulations'));
router.use('/knowledge', require('./knowledge'));
router.use('/ai', require('./ai'));
router.use('/ai-config', require('./ai-config'));
router.use('/deep-analysis', require('./deep-analysis'));
router.use('/search', require('./search'));
router.use('/auth', require('./auth'));

module.exports = router;