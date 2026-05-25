require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Sequelize = require('sequelize');
const neo4j = require('neo4j-driver');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    schema: config.schema,
    logging: config.logging,
    define: config.define,
    pool: config.pool || {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const neo4jDriver = neo4j.driver(
  `bolt://${process.env.NEO4J_HOST || 'localhost'}:${process.env.NEO4J_PORT || 7687}`,
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'LifeTheory@Neo4j2024'
  ),
  {
    maxConnectionPoolSize: 10,
    connectionTimeout: 30000
  }
);

const models = {
  sequelize,
  Sequelize,
  neo4jDriver,
  Case: require('./Case')(sequelize, Sequelize),
  User: require('./User')(sequelize, Sequelize),
  Verification: require('./Verification')(sequelize, Sequelize),
  Simulation: require('./Simulation')(sequelize, Sequelize),
  KnowledgeNode: require('./KnowledgeNode')(sequelize, Sequelize),
  AnalysisSession: require('./AnalysisSession')(sequelize, Sequelize),
  AnalysisRecord: require('./AnalysisRecord')(sequelize, Sequelize),
  AnalysisVector: require('./AnalysisVector')(sequelize, Sequelize)
};

Object.keys(models).forEach(key => {
  if (models[key] && typeof models[key].associate === 'function') {
    models[key].associate(models);
  }
});

module.exports = models;