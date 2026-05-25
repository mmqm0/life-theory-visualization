require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const db = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  methods: process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true'
}));

// 对SSE相关路由禁用压缩
app.use((req, res, next) => {
  if (req.path.includes('/deep-analysis/')) {
    res.setHeader('X-Accel-Buffering', 'no');
    next();
  } else {
    compression()(req, res, next);
  }
});

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

db.sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connection has been established successfully.');
    return db.neo4jDriver.verifyConnectivity();
  })
  .then(() => {
    console.log('Neo4j connection has been established successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the databases:', err);
    process.exit(1);
  });

module.exports = app;